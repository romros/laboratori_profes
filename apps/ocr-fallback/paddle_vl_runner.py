#!/usr/bin/env python3
"""
Runner local PaddleOCR-VL-1.5 — Spike A

Llegeix imatges PNG des d'un directori, aplica OCR amb PaddleOCR-VL-1.5 via
transformers (Hugging Face), i retorna JSON per stdout.

Contracte:
  Input:  directori amb fitxers *.png (noms: <stem>.png)
  Output: JSON {stem: {text, elapsed_ms}} per stdout
  Logs:   stderr (mai contingut OCR)

Privadesa:
  - Execució 100% local (model descarregat a cache local)
  - No persisteix imatges ni text OCR
  - Logs registren mètriques tècniques, mai contingut

Ús:
  python3 paddle_vl_runner.py /data
"""
import sys
import json
import os
import glob
import time


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "cal passar input_dir com a argument"}))
        sys.exit(1)

    input_dir = sys.argv[1]
    png_files = sorted(glob.glob(os.path.join(input_dir, "*.png")))

    if not png_files:
        print(json.dumps({}))
        return

    # Carregar model (una sola vegada)
    print(f"Carregant PaddleOCR-VL-1.5 ({len(png_files)} pàgines)…", file=sys.stderr)
    t_load_start = time.time()

    import torch
    from PIL import Image
    from transformers import AutoProcessor, AutoModelForImageTextToText

    model_path = os.environ.get("PADDLE_VL_MODEL", "PaddlePaddle/PaddleOCR-VL-1.5")
    device = "cuda" if torch.cuda.is_available() else "cpu"

    model = (
        AutoModelForImageTextToText
        .from_pretrained(model_path, torch_dtype=torch.bfloat16)
        .to(device)
        .eval()
    )
    processor = AutoProcessor.from_pretrained(model_path)

    t_load_ms = int((time.time() - t_load_start) * 1000)
    print(f"Model carregat en {t_load_ms}ms (device={device})", file=sys.stderr)

    results: dict = {}

    for png_path in png_files:
        stem = os.path.splitext(os.path.basename(png_path))[0]
        try:
            t0 = time.time()
            image = Image.open(png_path).convert("RGB")

            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": image},
                        {"type": "text", "text": "OCR:"},
                    ],
                }
            ]

            # Resolució màxima conservadora per limitar ús de RAM
            max_pixels = int(os.environ.get("PADDLE_VL_MAX_PIXELS", str(1280 * 28 * 28)))
            inputs = processor.apply_chat_template(
                messages,
                add_generation_prompt=True,
                tokenize=True,
                return_dict=True,
                return_tensors="pt",
                images_kwargs={
                    "size": {
                        "shortest_edge": processor.image_processor.min_pixels,
                        "longest_edge": max_pixels,
                    }
                },
            ).to(model.device)

            max_tokens = int(os.environ.get("PADDLE_VL_MAX_TOKENS", "1024"))
            with torch.inference_mode():
                outputs = model.generate(**inputs, max_new_tokens=max_tokens)

            text = processor.decode(outputs[0][inputs["input_ids"].shape[-1]:-1])
            elapsed_ms = int((time.time() - t0) * 1000)

            results[stem] = {"text": text, "elapsed_ms": elapsed_ms}
            print(f"  ✓ {stem[:60]}  {elapsed_ms}ms", file=sys.stderr)

        except Exception as e:
            results[stem] = {"text": f"(error: {e})", "elapsed_ms": -1}
            print(f"  ✗ {stem[:60]}  ERROR: {e}", file=sys.stderr)

    print(json.dumps(results))


if __name__ == "__main__":
    main()
