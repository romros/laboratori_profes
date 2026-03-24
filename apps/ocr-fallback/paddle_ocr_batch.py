#!/usr/bin/env python3
"""
Batch OCR helper per PaddleOCR — Spike B1.

Ús (via Docker):
  docker run --rm -v /tmp/spike-b1-data:/data profes-ocr-fallback /data

On /data conté fitxers *.png a processar.

Retorna JSON {stem: text} per stdout.
Logs de progrés per stderr (no contamina stdout).

Privadesa:
  - No guarda res fora del directori passat com a argument
  - El directori temporal és responsabilitat del caller
  - No fa logging de contingut d'imatges
"""
import sys
import json
import os
import glob


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "cal passar input_dir com a argument"}))
        sys.exit(1)

    input_dir = sys.argv[1]
    png_files = sorted(glob.glob(os.path.join(input_dir, "*.png")))

    if not png_files:
        print(json.dumps({}))
        return

    os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

    from paddleocr import PaddleOCR  # type: ignore

    print(f"Inicialitzant PaddleOCR ({len(png_files)} fitxers)…", file=sys.stderr)
    ocr = PaddleOCR(
        use_angle_cls=False,
        lang="en",
        use_gpu=False,
        show_log=False,
    )

    results: dict[str, str] = {}

    for png_path in png_files:
        stem = os.path.splitext(os.path.basename(png_path))[0]
        try:
            result = ocr.ocr(png_path, cls=False)
            lines: list[str] = []
            if result and result[0]:
                for line in result[0]:
                    if line and len(line) >= 2 and line[1]:
                        text_item = line[1]
                        if isinstance(text_item, (list, tuple)) and len(text_item) >= 1:
                            lines.append(str(text_item[0]))
            results[stem] = "\n".join(lines)
        except Exception as e:
            results[stem] = f"(error: {e})"

        print(f"  ✓ {stem[:70]}", file=sys.stderr)

    print(json.dumps(results))


if __name__ == "__main__":
    main()
