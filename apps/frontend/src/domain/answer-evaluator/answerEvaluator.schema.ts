import { z } from 'zod'

export const answerForEvaluationSchema = z.object({
  question_id: z.string(),
  answer_text: z.string(),
  ocr_status: z.enum(['ok', 'uncertain', 'empty', 'not_detected']),
})

export type AnswerForEvaluation = z.infer<typeof answerForEvaluationSchema>

export const questionEvaluationSchema = z.object({
  question_id: z.string(),
  /** Si l'OCR permet avaluar la resposta. */
  evaluable_by_ocr: z.enum(['yes', 'review', 'no']),
  evaluability_reason: z.string(),
  /** null si evaluable_by_ocr === 'no' (el LLM no es crida). */
  verdict: z.enum(['correct', 'partial', 'incorrect']).nullable(),
  feedback: z.string().nullable(),
  /** [0, 1]. null si evaluable_by_ocr === 'no'. */
  confidence: z.number().min(0).max(1).nullable(),
})

export type QuestionEvaluation = z.infer<typeof questionEvaluationSchema>

export const examEvaluationResultSchema = z.object({
  /** Identificador opac del caller — Feature 3 no interpreta identitat. */
  student_id: z.string(),
  question_results: z.array(questionEvaluationSchema),
})

export type ExamEvaluationResult = z.infer<typeof examEvaluationResultSchema>
