import type { OpenAiChatUsage } from '../../template-inference/services/openAiCompatibleChat'

/** Passada 1 (extracció / AssessmentSpec base): model eficient per defecte. */
export const DEFAULT_ASSESSMENT_SPEC_BASE_MODEL = 'gpt-5.4-mini'

/**
 * Passada 2 (enriqueiment pedagògic): model fort dins `v1/chat/completions`.
 * `gpt-5.4-pro` (març 2026) pot no estar exposat a aquest endpoint — usar env si cal.
 */
export const DEFAULT_ASSESSMENT_SPEC_ENRICH_MODEL = 'gpt-5.4'

export type AssessmentSpecLlmTelemetry = {
  phase: 'assessment_spec_base' | 'assessment_spec_enrich'
  model: string
  latencyMs: number
  usage?: OpenAiChatUsage
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
