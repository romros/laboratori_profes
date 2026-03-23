import { createWorker } from 'tesseract.js'

/**
 * MVP pas 2: OCR **només en català** (`cat`), sense barreja amb anglès per defecte.
 *
 * LÍMIT CONEGUT (benchmark 2026-03-22/23): Tesseract (WASM, CLI, preprocessing simple)
 * no resol documents amb escaneig de molt baixa qualitat (ex: ex_alumne4.pdf).
 * No continuar iterant paràmetres sense canviar d'estratègia (motor nou o preprocessing avançat).
 * Evidència: docs/benchmarks/ocr-benchmark-2026-03-22.md
 */
const DEFAULT_LANGS = 'cat'

/**
 * OCR per pàgina (PNG). Un sol worker per tot el document (spike).
 */
export async function ocrPngBuffersWithTesseract(
  pngPages: Buffer[],
  langs: string = DEFAULT_LANGS,
): Promise<string[]> {
  if (pngPages.length === 0) return []
  const worker = await createWorker(langs)
  try {
    const texts: string[] = []
    for (const png of pngPages) {
      const { data } = await worker.recognize(png)
      texts.push(data.text ?? '')
    }
    return texts
  } finally {
    await worker.terminate()
  }
}
