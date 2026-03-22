import {
  type QuestionAnswerExtractionDiagnostic,
  type QuestionAnswerExtractionItem,
  type QuestionAnswerExtractionResult,
  questionAnswerExtractionResultSchema,
} from '@/domain/question-answer-extraction/question_answer_extraction.schema'

import type {
  QuestionAnswerExtractionSpikeItem,
  QuestionAnswerExtractionSpikeResult,
} from '../types/spikeTypes'

/** Sufix afegit pel pipeline intern en talls per mida (no ha d’aparèixer a `answer_text`). */
const SPIKE_TRUNCATION_LINE = /\n\n\[[^\]]*spike pas 2:[^\]]*\]\s*$/i

/**
 * Separa text estable de marcadors interns de tall; retorna si s’ha detectat tall.
 */
export function stripInternalTruncationMarker(raw_text_block: string): {
  answer_text: string
  had_truncation_marker: boolean
  truncation_line?: string
} {
  const m = raw_text_block.match(SPIKE_TRUNCATION_LINE)
  if (!m || m.index === undefined) {
    return { answer_text: raw_text_block.trim(), had_truncation_marker: false }
  }
  const answer_text = raw_text_block.slice(0, m.index).trimEnd()
  return {
    answer_text,
    had_truncation_marker: true,
    truncation_line: m[0].trim(),
  }
}

/**
 * Converteix la sortida interna del pipeline (spike) al contracte estable de domini + diagnòstic.
 */
export function mapSpikeToQuestionAnswerExtraction(spike: QuestionAnswerExtractionSpikeResult): {
  result: QuestionAnswerExtractionResult
  diagnostic: QuestionAnswerExtractionDiagnostic
} {
  const truncation_notes: string[] = []
  const items: QuestionAnswerExtractionItem[] = spike.questions.map(
    (s: QuestionAnswerExtractionSpikeItem) => {
      const {
        answer_text: stripped,
        had_truncation_marker,
        truncation_line,
      } = stripInternalTruncationMarker(s.raw_text_block)
      if (had_truncation_marker && truncation_line) {
        truncation_notes.push(`${s.question_id}: ${truncation_line}`)
      }

      let status: QuestionAnswerExtractionItem['status']
      if (s.question_id === '_unsegmented') {
        status = 'uncertain'
      } else if (s.status === 'empty') {
        status = 'empty'
      } else if (s.status === 'unsupported') {
        status = 'uncertain'
      } else if (had_truncation_marker) {
        status = 'uncertain'
      } else {
        status = 'ok'
      }

      const answer_text = status === 'empty' ? '' : stripped

      return {
        question_id: s.question_id,
        answer_text,
        status,
        page_indices: s.page_indices,
      }
    },
  )

  const result = questionAnswerExtractionResultSchema.parse({ items })

  const diagnostic: QuestionAnswerExtractionDiagnostic = {
    page_count: spike.meta.page_count,
    raster_target_width: spike.meta.raster_target_width,
    ocr_languages: spike.meta.ocr_languages,
    detection_note: spike.meta.detection_note,
    marker_count_before_dedupe: spike.meta.marker_count_before_dedupe,
    marker_count_after_dedupe: spike.meta.marker_count_after_dedupe,
    truncation_notes: truncation_notes.length > 0 ? truncation_notes : undefined,
  }

  return { result, diagnostic }
}
