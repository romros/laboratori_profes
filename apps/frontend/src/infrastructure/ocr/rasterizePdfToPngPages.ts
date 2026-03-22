import { PDFParse } from 'pdf-parse'

export type RasterizedPdfPage = {
  pageIndex: number
  png: Buffer
  widthPx: number
  heightPx: number
}

type ScreenshotPageRow = {
  data: Uint8Array
  pageNumber: number
  width: number
  height: number
}

/** pdf-parse v2 té getScreenshot; els @types legacy no el declaren. */
type PdfParseWithScreenshot = {
  getScreenshot: (params: Record<string, unknown>) => Promise<{ pages: ScreenshotPageRow[] }>
}

/**
 * Rasteritza cada pàgina del PDF a PNG (Node, via canvas de pdf.js / @napi-rs/canvas).
 * Escala per millorar OCR (amplada objectiu ~1800 px).
 */
export async function rasterizePdfToPngPages(pdfBuffer: Buffer): Promise<RasterizedPdfPage[]> {
  const parser = new PDFParse({ data: pdfBuffer })
  try {
    const shots = await (parser as unknown as PdfParseWithScreenshot).getScreenshot({
      desiredWidth: 1800,
      imageBuffer: true,
      imageDataUrl: false,
    })
    const out: RasterizedPdfPage[] = []
    for (const p of shots.pages) {
      if (!p.data?.length) continue
      out.push({
        pageIndex: p.pageNumber,
        png: Buffer.from(p.data),
        widthPx: Math.round(p.width),
        heightPx: Math.round(p.height),
      })
    }
    return out
  } finally {
    await parser.destroy().catch(() => {})
  }
}
