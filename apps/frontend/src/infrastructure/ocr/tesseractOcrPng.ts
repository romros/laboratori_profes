import { createWorker } from 'tesseract.js'

/**
 * MVP pas 2: OCR **només en català** (`cat`), sense barreja amb anglès per defecte.
 * Si en un document concret el model cat falla massa, es pot valorar fallback explícit en tasca posterior.
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
