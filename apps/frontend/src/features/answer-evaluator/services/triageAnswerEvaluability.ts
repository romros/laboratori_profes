import type {
  AnswerForEvaluation,
  QuestionEvaluation,
} from '../../../domain/answer-evaluator/answerEvaluator.schema'

/**
 * PAS 1 del pipeline — sense LLM.
 * Decideix si una resposta OCR és avaluable i per quin motiu.
 * Guardrail: si retorna 'no', el LLM NO s'ha de cridar.
 */
export function triageAnswerEvaluability(
  answer: AnswerForEvaluation,
): Pick<QuestionEvaluation, 'evaluable_by_ocr' | 'evaluability_reason'> {
  if (answer.ocr_status === 'empty') {
    return {
      evaluable_by_ocr: 'no',
      evaluability_reason: "La resposta és buida (OCR status: 'empty').",
    }
  }

  if (answer.ocr_status === 'not_detected') {
    return {
      evaluable_by_ocr: 'no',
      evaluability_reason: "La pregunta no s'ha detectat al document (OCR status: 'not_detected').",
    }
  }

  if (answer.ocr_status === 'uncertain') {
    return {
      evaluable_by_ocr: 'review',
      evaluability_reason: "L'OCR ha marcat la resposta com a incerta. Revisió manual recomanada.",
    }
  }

  // ocr_status === 'ok'
  const trimmed = answer.answer_text.trim()
  if (trimmed.length < 10) {
    return {
      evaluable_by_ocr: 'review',
      evaluability_reason: 'Text massa curt per avaluar amb confiança (< 10 caràcters útils).',
    }
  }

  return {
    evaluable_by_ocr: 'yes',
    evaluability_reason: 'Resposta disponible i llegible.',
  }
}
