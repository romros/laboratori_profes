import type {
  OpenAiChatUsage,
  OpenAiLlmEndpointKind,
} from '../../template-inference/services/openAiCompatibleChat'

/** Passada 1 (extracció / AssessmentSpec base): model eficient per defecte. */
export const DEFAULT_ASSESSMENT_SPEC_BASE_MODEL = 'gpt-5.4-mini'

/**
 * Passada 2 (enriqueiment pedagògic): per defecte `gpt-5.4` (`chat/completions`).
 * Experimental (latència/cost alts): `ASSESSMENT_SPEC_ENRICH_MODEL=gpt-5.4-pro` → `/v1/responses`.
 */
export const DEFAULT_ASSESSMENT_SPEC_ENRICH_MODEL = 'gpt-5.4'

/** Base URL OpenAI (o compatible): una sola font per als serveis Feature 2. */
export const DEFAULT_ASSESSMENT_SPEC_OPENAI_BASE_URL = 'https://api.openai.com/v1'

export type AssessmentSpecLlmTelemetry = {
  phase: 'assessment_spec_base' | 'assessment_spec_enrich'
  model: string
  latencyMs: number
  usage?: OpenAiChatUsage
  endpointKind: OpenAiLlmEndpointKind
}

/**
 * URL base per a crides LLM Feature 2: paràmetre explícit → `ASSESSMENT_SPEC_OPENAI_BASE_URL` → defecte.
 */
export function resolveAssessmentSpecOpenAiBaseUrl(explicit?: string | null): string {
  const t = explicit?.trim()
  if (t) {
    return t
  }
  return (
    process.env.ASSESSMENT_SPEC_OPENAI_BASE_URL?.trim() || DEFAULT_ASSESSMENT_SPEC_OPENAI_BASE_URL
  )
}

/**
 * Model passada 1: `ASSESSMENT_SPEC_MODEL` → legacy `ASSESSMENT_SPEC_OPENAI_MODEL` → defecte.
 */
export function resolveAssessmentSpecBaseModel(explicit?: string | null): string {
  const t = explicit?.trim()
  if (t) {
    return t
  }
  return (
    process.env.ASSESSMENT_SPEC_MODEL?.trim() ||
    process.env.ASSESSMENT_SPEC_OPENAI_MODEL?.trim() ||
    DEFAULT_ASSESSMENT_SPEC_BASE_MODEL
  )
}

/**
 * Model passada 2: `ASSESSMENT_SPEC_ENRICH_MODEL` → legacy `ASSESSMENT_SPEC_OPENAI_MODEL` → defecte.
 */
export function resolveAssessmentSpecEnrichModel(explicit?: string | null): string {
  const t = explicit?.trim()
  if (t) {
    return t
  }
  return (
    process.env.ASSESSMENT_SPEC_ENRICH_MODEL?.trim() ||
    process.env.ASSESSMENT_SPEC_OPENAI_MODEL?.trim() ||
    DEFAULT_ASSESSMENT_SPEC_ENRICH_MODEL
  )
}
