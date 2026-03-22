import { createWorker } from 'tesseract.js'

const DEFAULT_LANGS = 'cat+eng'

/**
 * OCR per pagina (PNG). Un sol worker per tot el document (spike).
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
