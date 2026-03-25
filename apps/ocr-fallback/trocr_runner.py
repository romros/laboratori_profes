#!/usr/bin/env python3
"""
Spike C — TrOCR-Large handwritten
Processa pàgines PNG senceres amb microsoft/trocr-large-handwritten.

TrOCR treballa per línies. Aplica segmentació horitzontal per projection profile.
Cada línia es processa individualment per evitar problemes de tensor padding.

Contracte igual que paddle_vl_runner_gguf.py:
  Input:  directori *.png
  Output: JSON {stem: {text, elapsed_ms}} per stdout
  Logs:   stderr
"""
import sys
import json
import os
import glob
import time
import numpy as np
from PIL import Image

HF_CACHE = "/root/.cache/huggingface"
os.environ["HF_HOME"] = HF_CACHE
os.makedirs(HF_CACHE, exist_ok=True)


def segment_lines(img: Image.Image, min_height: int = 20) -> list:
    """Segmentació horitzontal simple per projection profile."""
    gray = np.array(img.convert("L"))
    dark_per_row = np.sum(gray < 200, axis=1)
    in_line = False
    lines = []
    start = 0
    for i, count in enumerate(dark_per_row):
        if not in_line and count > 5:
            in_line = True
            start = i
        elif in_line and count <= 2:
            in_line = False
            if i - start >= min_height:
                lines.append(img.crop((0, max(0, start - 4), img.width, i + 4)))
    if in_line and img.height - start >= min_height:
        lines.append(img.crop((0, max(0, start - 4), img.width, img.height)))
    return lines or [img]


def ocr_line(processor, model, line_img):
    """OCR d'una sola línia. Retorna string o llança excepció."""
    import torch
    rgb_img = line_img.convert("RGB")
    inputs = processor(images=rgb_img, return_tensors="pt")
    pixel_values = inputs.pixel_values
    with torch.no_grad():
        generated_ids = model.generate(pixel_values, max_new_tokens=128)
    decoded = processor.tokenizer.batch_decode(generated_ids, skip_special_tokens=True)
    return decoded[0].strip() if decoded else ""


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "cal passar input_dir"}))
        sys.exit(1)

    input_dir = sys.argv[1]
    png_files = sorted(glob.glob(os.path.join(input_dir, "*.png")))

    if not png_files:
        print(json.dumps({}))
        return

    print(f"Carregant TrOCR-Large ({len(png_files)} pàgines)…", file=sys.stderr)
    t0_load = time.time()

    from transformers import TrOCRProcessor, VisionEncoderDecoderModel

    model_id = "microsoft/trocr-large-handwritten"
    processor = TrOCRProcessor.from_pretrained(model_id)
    model = VisionEncoderDecoderModel.from_pretrained(model_id)
    model.eval()

    print(f"Model carregat en {int((time.time()-t0_load)*1000)}ms", file=sys.stderr)

    results = {}

    for png_path in png_files:
        stem = os.path.splitext(os.path.basename(png_path))[0]
        t0 = time.time()
        print(f"  Processant {stem}…", file=sys.stderr)

        try:
            img = Image.open(png_path).convert("RGB")
            lines = segment_lines(img)
            print(f"    {len(lines)} línies detectades", file=sys.stderr)

            texts = []
            for idx, line_img in enumerate(lines):
                try:
                    text = ocr_line(processor, model, line_img)
                    if text:
                        texts.append(text)
                except Exception as e_line:
                    print(f"    línia {idx} ERROR: {e_line}", file=sys.stderr)

            full_text = "\n".join(texts)
            elapsed_ms = int((time.time() - t0) * 1000)
            results[stem] = {"text": full_text, "elapsed_ms": elapsed_ms}
            print(f"  ✓ {stem}  {elapsed_ms}ms  ({len(texts)}/{len(lines)} línies ok)", file=sys.stderr)

        except Exception as e:
            results[stem] = {"text": f"(error: {e})", "elapsed_ms": -1}
            print(f"  ✗ {stem}  ERROR: {e}", file=sys.stderr)

    print(json.dumps(results, ensure_ascii=False))


if __name__ == "__main__":
    main()
