import { normalizeTemplateDraft } from './templateDraftNormalizer'
import type { TemplateDraftSource } from './templateDraftSource'
import {
  validateTemplateFeasibility,
  type TemplateFeasibilityPipelineResult,
} from './validateTemplateFeasibility'

/**
 * Pipeline: font → rawDraft → normalització → validator de viabilitat (`ok` | `ko` + regions).
 */
export async function analyzeExamText(
  input: { text: string },
  source: TemplateDraftSource,
): Promise<TemplateFeasibilityPipelineResult> {
  const rawDraft = await Promise.resolve(source.getDraft(input))
  const normalizedDraft = normalizeTemplateDraft(rawDraft)
  const result = validateTemplateFeasibility(normalizedDraft)
  return { rawDraft, normalizedDraft, result }
}
