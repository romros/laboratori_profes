import { z } from 'zod'

import type { QuestionSpec } from '../../../domain/assessment-spec/assessmentSpec.schema'
import type {
  AnswerForEvaluation,
  QuestionEvaluation,
} from '../../../domain/answer-evaluator/answerEvaluator.schema'
import {
  type ChatMessage,
  callOpenAiCompatibleChat,
} from '../../template-inference/services/openAiCompatibleChat'
import { buildEvaluateAnswerPrompt } from './evaluateAnswerPrompt'
import { triageAnswerEvaluability } from './triageAnswerEvaluability'

const llmVerdictSchema = z.object({
  verdict: z.enum(['correct', 'partial', 'incorrect']),
  feedback: z.string(),
  confidence: z.number().min(0).max(1),
})

export type EvaluateAnswerParams = {
  questionSpec: QuestionSpec
  answer: AnswerForEvaluation
  apiKey: string
  baseUrl?: string
  model?: string
  examDocumentContext?: string
  fetchImpl?: typeof fetch
}

const DEFAULT_EVALUATOR_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_EVALUATOR_MODEL = 'gpt-5.4'

/**
 * Un LLM call per pregunta avaluable.
 * Guardrail: si evaluable_by_ocr === 'no', retorna veredicte null sense cridar LLM.
 */
export async function evaluateAnswer(params: EvaluateAnswerParams): Promise<QuestionEvaluation> {
  const { questionSpec, answer, apiKey, examDocumentContext, fetchImpl } = params
  const baseUrl = params.baseUrl?.trim() || DEFAULT_EVALUATOR_BASE_URL
  const model = params.model?.trim() || DEFAULT_EVALUATOR_MODEL

  const triage = triageAnswerEvaluability(answer)

  // Guardrail: no cridar LLM si no és avaluable
  if (triage.evaluable_by_ocr === 'no') {
    return {
      question_id: answer.question_id,
      ...triage,
      verdict: null,
      feedback: null,
      confidence: null,
    }
  }

  const userContent = buildEvaluateAnswerPrompt({
    questionSpec,
    answerText: answer.answer_text,
    examDocumentContext,
  })

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        "Ets un avaluador pedagògic expert. Avalues respostes d'alumnes contra un AssessmentSpec del professor. Respon NOMÉS amb JSON vàlid, sense markdown ni text fora del JSON.",
    },
    { role: 'user', content: userContent },
  ]

  const rawContent = await callOpenAiCompatibleChat({
    apiKey,
    baseUrl,
    model,
    messages,
    fetchImpl,
  })

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent.trim())
  } catch {
    throw new Error(`evaluateAnswer: JSON invàlid del model per a ${answer.question_id}`)
  }

  const llmResult = llmVerdictSchema.parse(parsed)

  return {
    question_id: answer.question_id,
    ...triage,
    verdict: llmResult.verdict,
    feedback: llmResult.feedback,
    confidence: Math.min(1, Math.max(0, llmResult.confidence)),
  }
}
