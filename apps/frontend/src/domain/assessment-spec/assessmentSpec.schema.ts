import { z } from 'zod'

export const questionSpecSchema = z.object({
  question_id: z.string(),
  question_text: z.string(),
  max_score: z.number().nullable(),
  question_type: z.string(),
  expected_answer: z.string().optional(),
  what_to_evaluate: z.array(z.string()),
  required_elements: z.array(z.string()),
  accepted_variants: z.array(z.string()),
  important_mistakes: z.array(z.string()),
  teacher_style_notes: z.array(z.string()),
  extraction_confidence: z.number().min(0).max(1),
  inference_confidence: z.number().min(0).max(1),
})

export type QuestionSpec = z.infer<typeof questionSpecSchema>

export const assessmentSpecSchema = z.object({
  exam_id: z.string(),
  title: z.string().optional(),
  questions: z.array(questionSpecSchema),
})

export type AssessmentSpec = z.infer<typeof assessmentSpecSchema>
