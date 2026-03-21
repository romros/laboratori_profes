import { normalizeTemplateDraft } from './templateDraftNormalizer'
import type { TemplateDraftSource } from './templateDraftSource'
import { validateTemplateDraft, type ValidateTemplateDraftResult } from './validateTemplateDraft'

import { minimalValidTemplate } from '../../../../fixtures/template-inference/minimal-template'

/**
 * Pipeline: font → rawDraft → normalizer → validator.
 * L’origen del draft ve exclusivament de `source`; aquest mòdul no decideix mock vs futur LLM.
 */
export async function analyzeExamText(
  input: { text: string },
  source: TemplateDraftSource,
): Promise<{
  rawDraft: unknown
  normalizedDraft: unknown
  validated: ValidateTemplateDraftResult
}> {
  const rawDraft = await Promise.resolve(source.getDraft(input))
  const normalizedDraft = normalizeTemplateDraft(rawDraft)

  const validated = validateTemplateDraft({
    exam: normalizedDraft,
    template: structuredClone(minimalValidTemplate),
  })

  return { rawDraft, normalizedDraft, validated }
}
