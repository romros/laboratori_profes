/**
 * Contracte de l'spike (no és el contracte final de domini; veure mvp-definition.md).
 */
export type QuestionAnswerSpikeStatus = 'ok' | 'empty' | 'unsupported'

export type QuestionAnswerExtractionSpikeItem = {
  question_id: string
  status: QuestionAnswerSpikeStatus
  raw_text_block: string
  page_indices: number[]
}

export type QuestionAnswerExtractionSpikeResult = {
  questions: QuestionAnswerExtractionSpikeItem[]
  meta: {
    page_count: number
    raster_target_width: number
    ocr_languages: string
    detection_note?: string
  }
}
