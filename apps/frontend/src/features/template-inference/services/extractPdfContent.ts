import { PDFParse } from 'pdf-parse'

const MIN_EXTRACTED_TEXT_CHARS = 10

export type ExtractPdfContentOk = {
  ok: true
  text: string
  pageCount: number
}

export type ExtractPdfContentErr = {
  ok: false
  error: string
}

export type ExtractPdfContentResult = ExtractPdfContentOk | ExtractPdfContentErr

/** Text embegut del PDF (pdf.js); sense OCR ni coordenades. */
export async function extractPdfContent(buffer: Buffer): Promise<ExtractPdfContentResult> {
  const parser = new PDFParse({ data: buffer })
  try {
    const textResult = await parser.getText()
    const text = (textResult.text ?? '').replace(/\u00a0/g, ' ').trim()
    if (text.length < MIN_EXTRACTED_TEXT_CHARS) {
      return {
        ok: false,
        error:
          "No s'ha pogut extreure prou text embegut del PDF (cal text seleccionable; sense OCR en aquest pas).",
      }
    }
    return { ok: true, text, pageCount: textResult.total }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `No s'ha pogut llegir el PDF: ${msg}` }
  } finally {
    await parser.destroy().catch(() => {})
  }
}
