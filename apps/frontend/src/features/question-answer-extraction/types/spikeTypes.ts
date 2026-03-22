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
    /** Recompte de marcadors abans de deduplicació (diagnòstic). */
    marker_count_before_dedupe?: number
    /** Recompte després de deduplicació per primera aparició de `question_id`. */
    marker_count_after_dedupe?: number
  }
}
