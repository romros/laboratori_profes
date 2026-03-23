import { z } from 'zod'

import {
  assessmentSpecSchema,
  questionSpecSchema,
  type AssessmentSpec,
} from '../../../domain/assessment-spec/assessmentSpec.schema'
import { callOpenAiCompatibleChat } from '../../template-inference/services/openAiCompatibleChat'
import { buildAssessmentSpecPrompt } from './buildAssessmentSpecPrompt'

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'

/** Camps que el schema exigeix com a array; el model sovint envia un sol string. */
const QUESTION_LIST_KEYS = [
  'what_to_evaluate',
  'required_elements',
  'accepted_variants',
  'important_mistakes',
  'teacher_style_notes',
] as const

function normalizeLlmQuestionShape(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return raw
  }
  const o = { ...(raw as Record<string, unknown>) }
  for (const key of QUESTION_LIST_KEYS) {
    const v = o[key]
    if (typeof v === 'string') {
      const t = v.trim()
      o[key] = t.length === 0 ? [] : [t]
    } else if (v == null) {
      o[key] = []
    }
  }
  return o
}

export type BuildAssessmentSpecParams = {
  examText: string
  solutionText: string
  apiKey: string
  baseUrl?: string
  model?: string
  fetchImpl?: typeof fetch
}

/**
 * Construeix un AssessmentSpec a partir del text de l'enunciat i el solucionari,
 * usant un model LLM compatible amb l'API OpenAI.
 */
export async function buildAssessmentSpec(
  params: BuildAssessmentSpecParams,
): Promise<AssessmentSpec> {
  const { examText, solutionText, apiKey, fetchImpl } = params
  const baseUrl = params.baseUrl?.trim() || DEFAULT_BASE_URL
  const model = params.model?.trim() || DEFAULT_MODEL

  const prompt = buildAssessmentSpecPrompt(examText, solutionText)

  const rawContent = await callOpenAiCompatibleChat({
    apiKey,
    baseUrl,
    model,
    messages: [
      {
        role: 'system',
        content:
          "Ets un extractor estructurat d'avaluació acadèmica. Respon NOMÉS amb un array JSON vàlid: cap text fora del JSON, sense markdown ni codi de blocs.",
      },
      { role: 'user', content: prompt },
    ],
    fetchImpl,
  })

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent.trim())
  } catch {
    throw new Error('Resposta del model: JSON invàlid al parsear array de preguntes')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Resposta del model: cal un array JSON de preguntes')
  }

  const coerced = parsed.map(normalizeLlmQuestionShape)
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
