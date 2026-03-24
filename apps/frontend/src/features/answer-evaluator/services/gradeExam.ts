import type { AssessmentSpec } from '../../../domain/assessment-spec/assessmentSpec.schema'
import type {
  AnswerForEvaluation,
  ExamEvaluationResult,
} from '../../../domain/answer-evaluator/answerEvaluator.schema'
import { evaluateAnswer } from './evaluateAnswer'
import { routeQuestionForEvaluation } from './routeQuestionForEvaluation'

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
 *   1. Router pre-LLM (routeQuestionForEvaluation) — sense LLM
 *   2. text  → evaluateAnswer (un LLM call)
 *      vision → reservat MVP (tractat com skip)
 *      skip   → veredicte null, sense LLM
 *
 * Invariant: cap pregunta passa per dos canals en la mateixa execució.
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

      // ── Router pre-LLM ────────────────────────────────────────────────────────
      const routing = routeQuestionForEvaluation(answer)

      if (routing.route === 'skip') {
        return {
          question_id: answer.question_id,
          evaluable_by_ocr: 'no' as const,
          evaluability_reason: routing.reason,
          verdict: null,
          feedback: null,
          confidence: null,
        }
      }

      if (routing.route === 'vision') {
        // Vision reservat per MVP — sense crops disponibles → tractat com skip
        return {
          question_id: answer.question_id,
          evaluable_by_ocr: 'no' as const,
          evaluability_reason: `Canal vision reservat (MVP sense crops): ${routing.reason}`,
          verdict: null,
          feedback: null,
          confidence: null,
        }
      }

      // routing.route === 'text' → canal textual → LLM call
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
