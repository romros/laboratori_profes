import type { AssessmentSpec } from '../../../domain/assessment-spec/assessmentSpec.schema'
import type {
  AnswerForEvaluation,
  ExamEvaluationResult,
} from '../../../domain/answer-evaluator/answerEvaluator.schema'
import { evaluateAnswer } from './evaluateAnswer'

export type GradeExamInput = {
  student_id: string
  assessment_spec: AssessmentSpec
  answers: AnswerForEvaluation[]
  exam_document_context?: string
}

export type GradeExamParams = GradeExamInput & {
  apiKey: string
  baseUrl?: string
  model?: string
  fetchImpl?: typeof fetch
}

/**
 * Orquestrador principal de Feature 3 MVP.
 * Per cada resposta:
 *   1. OCR triage (sense LLM)
 *   2. Si avaluable → crida LLM (evaluateAnswer)
 *   3. Retorna ExamEvaluationResult complet
 *
 * Cada pregunta s'avalua de forma independent (un LLM call per pregunta avaluable).
 */
export async function gradeExam(params: GradeExamParams): Promise<ExamEvaluationResult> {
  const {
    student_id,
    assessment_spec,
    answers,
    exam_document_context,
    apiKey,
    baseUrl,
    model,
    fetchImpl,
  } = params

  const specById = new Map(assessment_spec.questions.map((q) => [q.question_id, q]))

  const question_results = await Promise.all(
    answers.map(async (answer) => {
      const questionSpec = specById.get(answer.question_id)

      // Si no hi ha spec per aquesta pregunta → marcar com a no avaluable
      if (!questionSpec) {
        return {
          question_id: answer.question_id,
          evaluable_by_ocr: 'no' as const,
          evaluability_reason: `Pregunta '${answer.question_id}' no trobada a l'AssessmentSpec.`,
          verdict: null,
          feedback: null,
          confidence: null,
        }
      }

      return evaluateAnswer({
        questionSpec,
        answer,
        apiKey,
        baseUrl,
        model,
        examDocumentContext: exam_document_context,
        fetchImpl,
      })
    }),
  )

  return {
    student_id,
    question_results,
  }
}
