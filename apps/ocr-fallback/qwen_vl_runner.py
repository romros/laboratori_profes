#!/usr/bin/env python3
"""
Spike C — Qwen2.5-VL-2B GGUF via llama-server
Mateix contracte que paddle_vl_runner_gguf.py:
  Input:  directori *.png  +  VL_SERVER_URL (env)
  Output: JSON {stem: {text, elapsed_ms}} per stdout
  Logs:   stderr
"""
import sys, json, os, glob, time, base64

def encode_image_b64(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "cal passar input_dir"}))
        sys.exit(1)

    input_dir = sys.argv[1]
    png_files = sorted(glob.glob(os.path.join(input_dir, "*.png")))
    server_url = os.environ.get("VL_SERVER_URL", "http://localhost:8112/v1")

    if not png_files:
        print(json.dumps({}))
        return

    print(f"Qwen2.5-VL via llama-server @ {server_url}", file=sys.stderr)
    print(f"  {len(png_files)} pàgines", file=sys.stderr)

    from openai import OpenAI
    client = OpenAI(base_url=server_url, api_key="null")

    results: dict = {}

    for png_path in png_files:
        stem = os.path.splitext(os.path.basename(png_path))[0]
        try:
            t0 = time.time()
            print(f"  Processant {stem}…", file=sys.stderr)

            img_b64 = encode_image_b64(png_path)
            response = client.chat.completions.create(
                model="Qwen2.5-VL-2B",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}},
                            {"type": "text", "text": "OCR:"},
                        ],
                    }
                ],
                max_tokens=800,
                temperature=0,
                extra_body={"repeat_penalty": 1.15},
            )

            text = response.choices[0].message.content or ""
            elapsed_ms = int((time.time() - t0) * 1000)
            results[stem] = {"text": text, "elapsed_ms": elapsed_ms}
            print(f"  ✓ {stem}  {elapsed_ms}ms", file=sys.stderr)

        except Exception as e:
            results[stem] = {"text": f"(error: {e})", "elapsed_ms": -1}
            print(f"  ✗ {stem}  ERROR: {e}", file=sys.stderr)

    print(json.dumps(results, ensure_ascii=False))


if __name__ == "__main__":
    main()
