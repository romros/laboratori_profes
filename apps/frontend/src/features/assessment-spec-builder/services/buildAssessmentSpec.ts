import { z } from 'zod'

import {
  assessmentSpecSchema,
  questionSpecSchema,
  type AssessmentSpec,
} from '../../../domain/assessment-spec/assessmentSpec.schema'
import {
  type ChatMessage,
  callOpenAiCompatibleChat,
  callOpenAiCompatibleChatWithMeta,
} from '../../template-inference/services/openAiCompatibleChat'
import {
  type AssessmentSpecLlmTelemetry,
  resolveAssessmentSpecBaseModel,
  resolveAssessmentSpecOpenAiBaseUrl,
} from './assessmentSpecModelEnv'
import { buildAssessmentSpecPrompt } from './buildAssessmentSpecPrompt'
import { normalizeLlmQuestionListFields } from './normalizeLlmQuestionListFields'

export type BuildAssessmentSpecParams = {
  examText: string
  solutionText: string
  apiKey: string
  baseUrl?: string
  /** Override explícit; si s’omet, es resol amb env (`ASSESSMENT_SPEC_MODEL`, …). */
  model?: string
  fetchImpl?: typeof fetch
  /** Telemetria opcional (calibratge, logs): una crida per passada base. */
  onLlmRound?: (t: AssessmentSpecLlmTelemetry) => void
}

/**
 * Construeix un AssessmentSpec a partir del text de l'enunciat i el solucionari,
 * usant un model LLM compatible amb l'API OpenAI.
 */
export async function buildAssessmentSpec(
  params: BuildAssessmentSpecParams,
): Promise<AssessmentSpec> {
  const { examText, solutionText, apiKey, fetchImpl, onLlmRound } = params
  const baseUrl = resolveAssessmentSpecOpenAiBaseUrl(params.baseUrl)
  const model = resolveAssessmentSpecBaseModel(params.model)

  const prompt = buildAssessmentSpecPrompt(examText, solutionText)

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        "Ets un extractor estructurat d'avaluació acadèmica. Respon NOMÉS amb un array JSON vàlid: cap text fora del JSON, sense markdown ni codi de blocs.",
    },
    { role: 'user', content: prompt },
  ]

  const chatParams = {
    apiKey,
    baseUrl,
    model,
    messages,
    fetchImpl,
  }

  let rawContent: string
  if (onLlmRound) {
    const r = await callOpenAiCompatibleChatWithMeta(chatParams)
    onLlmRound({
      phase: 'assessment_spec_base',
      model,
      latencyMs: r.latencyMs,
      usage: r.usage,
      endpointKind: r.endpointKind,
    })
    rawContent = r.content
  } else {
    rawContent = await callOpenAiCompatibleChat(chatParams)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent.trim())
  } catch {
    throw new Error('Resposta del model: JSON invàlid al parsear array de preguntes')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Resposta del model: cal un array JSON de preguntes')
  }

  const coerced = parsed.map(normalizeLlmQuestionListFields)
  const questions = z.array(questionSpecSchema).parse(coerced)

  const title = examText
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0)

  const raw: unknown = {
    exam_id: `exam_${Date.now()}`,
    title: title ?? undefined,
    questions,
  }

  return assessmentSpecSchema.parse(raw)
}
