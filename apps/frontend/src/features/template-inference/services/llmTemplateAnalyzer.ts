import { normalizeTemplateDraft } from '@/features/template-inference/services/templateDraftNormalizer'
import {
  validateTemplateDraft,
  type ValidateTemplateDraftResult,
} from '@/features/template-inference/services/validateTemplateDraft'

import { goBasicExam } from '../../../../fixtures/template-inference/go-basic'
import { minimalValidTemplate } from '../../../../fixtures/template-inference/minimal-template'

/**
 * Scaffold sense crides externes: simula l’output d’un LLM amb un draft fix (cas go-basic).
 * El paràmetre `text` s’ignora (reservat per futures tasques d’adapter).
 * El draft passa per `normalizeTemplateDraft` abans del validator.
 */
export function analyzeExamText(input: { text: string }): {
  rawDraft: unknown
  normalizedDraft: unknown
  validated: ValidateTemplateDraftResult
} {
  void input.text

  const rawDraft: unknown = structuredClone(goBasicExam)
  const normalizedDraft = normalizeTemplateDraft(rawDraft)

  const validated = validateTemplateDraft({
    exam: normalizedDraft,
    template: structuredClone(minimalValidTemplate),
  })

  return { rawDraft, normalizedDraft, validated }
}
