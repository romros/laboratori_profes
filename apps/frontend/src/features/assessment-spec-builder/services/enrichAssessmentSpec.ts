import {
  assessmentSpecSchema,
  type AssessmentSpec,
} from '../../../domain/assessment-spec/assessmentSpec.schema'
import { callOpenAiCompatibleChat } from '../../template-inference/services/openAiCompatibleChat'
import { buildEnrichAssessmentSpecPrompt } from './enrichAssessmentSpecPrompt'
import { normalizeAssessmentSpecQuestionsInRaw } from './normalizeLlmQuestionListFields'

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'

export type EnrichAssessmentSpecParams = {
  spec: AssessmentSpec
  apiKey: string
  baseUrl?: string
  model?: string
  fetchImpl?: typeof fetch
}

/**
 * Fusiona només els camps pedagògics del model; la resta ve del spec base (font de veritat).
 */
export function mergeEnrichmentPedagogyFields(
  base: AssessmentSpec,
  enrichedParsed: AssessmentSpec,
): AssessmentSpec {
  if (base.questions.length !== enrichedParsed.questions.length) {
    throw new Error(
      `Enriqueiment pedagògic: nombre de preguntes diferent (${base.questions.length} vs ${enrichedParsed.questions.length})`,
    )
  }

  const enrichedById = new Map(enrichedParsed.questions.map((q) => [q.question_id, q]))
  const baseIds = new Set(base.questions.map((q) => q.question_id))

  const questions = base.questions.map((q) => {
    const e = enrichedById.get(q.question_id)
    if (!e) {
      throw new Error(
        `Enriqueiment pedagògic: falta question_id ${q.question_id} a la resposta del model`,
      )
    }
    return {
      ...q,
      what_to_evaluate: e.what_to_evaluate,
      required_elements: e.required_elements,
      important_mistakes: e.important_mistakes,
      teacher_style_notes: e.teacher_style_notes,
    }
  })

  for (const id of enrichedById.keys()) {
    if (!baseIds.has(id)) {
      throw new Error(`Enriqueiment pedagògic: question_id desconegut del model: ${id}`)
    }
  }

  return {
    ...base,
    questions,
  }
}

/**
 * Segon pas: enriqueix what_to_evaluate, required_elements, important_mistakes i teacher_style_notes
 * via LLM; la resta del AssessmentSpec roman igual que `spec`.
 */
export async function enrichAssessmentSpec(
  params: EnrichAssessmentSpecParams,
): Promise<AssessmentSpec> {
  const { spec, apiKey, fetchImpl } = params
  const baseUrl = params.baseUrl?.trim() || DEFAULT_BASE_URL
  const model = params.model?.trim() || DEFAULT_MODEL

  const userContent = buildEnrichAssessmentSpecPrompt(JSON.stringify(spec, null, 2))

  const rawContent = await callOpenAiCompatibleChat({
    apiKey,
    baseUrl,
    model,
    messages: [
      {
        role: 'system',
        content:
          'Ets un assistent que millora criteris pedagògics. Respon NOMÉS amb un objecte JSON vàlid (AssessmentSpec complet), sense markdown ni text fora del JSON.',
      },
      { role: 'user', content: userContent },
    ],
    fetchImpl,
  })

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent.trim())
  } catch {
    throw new Error('Enriqueiment pedagògic: JSON invàlid del model')
  }

  const coerced = normalizeAssessmentSpecQuestionsInRaw(parsed)
  const enrichedDraft = assessmentSpecSchema.parse(coerced)

  const merged = mergeEnrichmentPedagogyFields(spec, enrichedDraft)
  return assessmentSpecSchema.parse(merged)
}
