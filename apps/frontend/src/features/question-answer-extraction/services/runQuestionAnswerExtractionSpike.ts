import { rasterizePdfToPngPages } from '@/infrastructure/ocr/rasterizePdfToPngPages'
import { ocrPngBuffersWithTesseract } from '@/infrastructure/ocr/tesseractOcrPng'

import type { QuestionAnswerExtractionSpikeResult } from '../types/spikeTypes'

import { findQuestionMarkers } from './detectQuestionMarkers'
import { segmentByQuestionMarkers } from './segmentByQuestionMarkers'

const RASTER_WIDTH = 1800
const OCR_LANGS = 'cat+eng'

/**
 * Pipeline spike: PDF → PNG per pàgina → OCR → marcadors → segments.
 * Només per execució local / proves; no és API pública estable.
 */
export async function runQuestionAnswerExtractionSpike(
  pdfBuffer: Buffer,
): Promise<QuestionAnswerExtractionSpikeResult> {
  const pages = await rasterizePdfToPngPages(pdfBuffer)
  const pngs = pages.map((p) => p.png)
  const ocrTexts = await ocrPngBuffersWithTesseract(pngs, OCR_LANGS)

  let fullText = ''
  for (let i = 0; i < ocrTexts.length; i++) {
    const pageNum = pages[i]?.pageIndex ?? i + 1
    fullText += `\n<<<PAGE ${pageNum}>>>\n${ocrTexts[i]}`
  }

  const markers = findQuestionMarkers(fullText)
  let questions = segmentByQuestionMarkers(fullText, markers)

  let detection_note: string | undefined
  if (markers.length === 0) {
    detection_note =
      'Cap marcador tipus "N." / "N)" / "Pregunta N" trobat al text OCR; segmentació per pregunta no aplicable.'
    const preview = fullText
      .replace(/<<<PAGE \d+>>>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 400)
    questions = [
      {
        question_id: '_unsegmented',
        status: 'unsupported',
        raw_text_block: preview,
        page_indices: pages.map((p) => p.pageIndex),
      },
    ]
  }

  return {
    questions,
    meta: {
      page_count: pages.length,
      raster_target_width: RASTER_WIDTH,
      ocr_languages: OCR_LANGS,
      detection_note,
    },
  }
}
