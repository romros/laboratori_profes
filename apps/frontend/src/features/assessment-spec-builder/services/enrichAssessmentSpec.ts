import { z } from 'zod'

import {
  assessmentSpecSchema,
  type AssessmentSpec,
} from '../../../domain/assessment-spec/assessmentSpec.schema'
import {
  type ChatMessage,
  callOpenAiCompatibleChat,
  callOpenAiCompatibleChatWithMeta,
} from '../../template-inference/services/openAiCompatibleChat'
import {
  type AssessmentSpecLlmTelemetry,
  resolveAssessmentSpecEnrichModel,
  resolveAssessmentSpecOpenAiBaseUrl,
} from './assessmentSpecModelEnv'
import { buildEnrichAssessmentSpecPrompt } from './enrichAssessmentSpecPrompt'
import { normalizeLlmQuestionListFields } from './normalizeLlmQuestionListFields'

/** Només els camps pedagògics que el segon model ha de retornar (la resta ve del base). */
const enrichmentPedagogyQuestionSchema = z.object({
  question_id: z.string(),
  what_to_evaluate: z.array(z.string()),
  required_elements: z.array(z.string()),
  accepted_variants: z.array(z.string()),
  important_mistakes: z.array(z.string()),
  teacher_style_notes: z.array(z.string()),
})

export type EnrichmentPedagogyQuestion = z.infer<typeof enrichmentPedagogyQuestionSchema>

export type EnrichAssessmentSpecParams = {
  spec: AssessmentSpec
  apiKey: string
  baseUrl?: string
  /** Override explícit; si s’omet, es resol amb env (`ASSESSMENT_SPEC_ENRICH_MODEL`, …). */
  model?: string
  /**
   * Context original del professor (suport pedagògic al prompt).
   * No substitueix el spec base; veure `buildEnrichAssessmentSpecPrompt`.
   */
  examText?: string
  solutionText?: string
  fetchImpl?: typeof fetch
  onLlmRound?: (t: AssessmentSpecLlmTelemetry) => void
}

/**
 * Fusiona només els camps pedagògics del model; la resta ve del spec base (font de veritat).
 */
export function mergeEnrichmentPedagogyFields(
  base: AssessmentSpec,
  enrichmentQuestions: EnrichmentPedagogyQuestion[],
): AssessmentSpec {
  if (base.questions.length !== enrichmentQuestions.length) {
    throw new Error(
      `Enriqueiment pedagògic: nombre de preguntes diferent (${base.questions.length} vs ${enrichmentQuestions.length})`,
    )
  }

  const enrichedById = new Map(enrichmentQuestions.map((q) => [q.question_id, q]))
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
      accepted_variants: e.accepted_variants,
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

/** Extreu només els camps pedagògics del JSON que retorna el model (objecte amb `questions` o array). */
export function parseEnrichmentPedagogyFromModelJson(
  parsed: unknown,
): EnrichmentPedagogyQuestion[] {
  let questionsRaw: unknown
  if (Array.isArray(parsed)) {
    questionsRaw = parsed
  } else if (typeof parsed === 'object' && parsed !== null && 'questions' in parsed) {
    questionsRaw = (parsed as { questions: unknown }).questions
  } else {
    throw new Error(
      'Enriqueiment pedagògic: cal un objecte JSON amb clau `questions` o un array de preguntes',
    )
  }
  if (!Array.isArray(questionsRaw)) {
    throw new Error('Enriqueiment pedagògic: `questions` ha de ser un array')
  }
  const normalized = questionsRaw.map(normalizeLlmQuestionListFields)
  return z.array(enrichmentPedagogyQuestionSchema).parse(normalized)
}

/**
 * Segon pas: enriqueix camps pedagògics via LLM; la veritat documental del base (text, solució, scores, confiances) roman al merge.
 */
export async function enrichAssessmentSpec(
  params: EnrichAssessmentSpecParams,
): Promise<AssessmentSpec> {
  const { spec, apiKey, fetchImpl, onLlmRound, examText, solutionText } = params
  const baseUrl = resolveAssessmentSpecOpenAiBaseUrl(params.baseUrl)
  const model = resolveAssessmentSpecEnrichModel(params.model)

  /** Cos usuari: ASSESSMENT_SPEC_BASE + ENUNCIAT ORIGINAL + SOLUCIONARI ORIGINAL (veure `buildEnrichAssessmentSpecPrompt`). */
  const userContent = buildEnrichAssessmentSpecPrompt({
    specJson: JSON.stringify(spec, null, 2),
    examText,
    solutionText,
  })

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'Ets un assistent que millora criteris pedagògics sense reinterpretar la veritat documental del professor. Respon NOMÉS amb JSON vàlid (AssessmentSpec o questions[] amb camps pedagògics permesos), sense markdown ni text fora del JSON.',
    },
    { role: 'user', content: userContent },
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
      phase: 'assessment_spec_enrich',
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
    throw new Error('Enriqueiment pedagògic: JSON invàlid del model')
  }

  const pedagogyQuestions = parseEnrichmentPedagogyFromModelJson(parsed)

  const merged = mergeEnrichmentPedagogyFields(spec, pedagogyQuestions)
  return assessmentSpecSchema.parse(merged)
}
