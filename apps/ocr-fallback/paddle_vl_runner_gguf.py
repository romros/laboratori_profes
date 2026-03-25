#!/usr/bin/env python3
"""
Runner PaddleOCR-VL-1.5 via llama.cpp (GGUF) — Spike VL-GGUF
Crida directa a llama-server via API OpenAI (evita el pipeline multi-torn de paddleocr).

Contracte:
  Input:  directori amb fitxers *.png
  Output: JSON {stem: {text, elapsed_ms}} per stdout
  Logs:   stderr

Prerequisit:
  llama-server en marxa amb PaddleOCR-VL-1.5-GGUF (port 8111)
  Veure docker-compose.vl-gguf.yml

Ús:
  python3 paddle_vl_runner_gguf.py /data
"""
import sys
import json
import os
import glob
import time
import base64


def encode_image_b64(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "cal passar input_dir com a argument"}))
        sys.exit(1)

    input_dir = sys.argv[1]
    png_files = sorted(glob.glob(os.path.join(input_dir, "*.png")))

    if not png_files:
        print(json.dumps({}))
        return

    server_url = os.environ.get("VL_SERVER_URL", "http://localhost:8111/v1")
    print(f"Connectant a llama-server ({len(png_files)} pàgines)…", file=sys.stderr)
    print(f"  url: {server_url}", file=sys.stderr)

    from openai import OpenAI

    client = OpenAI(base_url=server_url, api_key="null")

    # Prompt OCR per a exàmens manuscrits SQL/DAW en català/castellà
    SYSTEM_PROMPT = (
        "You are an OCR assistant. Transcribe ALL text visible in the image exactly as written, "
        "including handwritten SQL code, headers, and annotations. "
        "Preserve structure. Do not interpret or correct errors."
    )

    results: dict = {}

    for png_path in png_files:
        stem = os.path.splitext(os.path.basename(png_path))[0]
        try:
            t0 = time.time()
            print(f"  Processant {stem}…", file=sys.stderr)

            img_b64 = encode_image_b64(png_path)

            response = client.chat.completions.create(
                model="PaddleOCR-VL-1.5",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/png;base64,{img_b64}"},
                            },
                            {
                                "type": "text",
                                "text": "OCR:",
                            },
                        ],
                    }
                ],
                max_tokens=800,
                temperature=0,
                extra_body={"repeat_penalty": 1.15},
            )

            text = response.choices[0].message.content or ""
            elapsed_ms = int((time.time() - t0) * 1000)

            results[stem] = {"text": text.strip(), "elapsed_ms": elapsed_ms}
            print(f"  ✓ {stem}  {elapsed_ms}ms", file=sys.stderr)

        except Exception as e:
            results[stem] = {"text": f"(error: {e})", "elapsed_ms": -1}
            print(f"  ✗ {stem}  ERROR: {e}", file=sys.stderr)

    print(json.dumps(results, ensure_ascii=False))


if __name__ == "__main__":
    main()
