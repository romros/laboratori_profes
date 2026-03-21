import {
  validateTemplateDraft,
  type ValidateTemplateDraftResult,
} from '@/features/template-inference/services/validateTemplateDraft'

import { goBasicExam } from '../../../../fixtures/template-inference/go-basic'
import { minimalValidTemplate } from '../../../../fixtures/template-inference/minimal-template'

/**
 * Scaffold sense crides externes: simula l’output d’un LLM amb un draft fix (cas go-basic).
 * El paràmetre `text` s’ignora (reservat per futures tasques d’adapter).
 */
export function analyzeExamText(input: { text: string }): {
  rawDraft: unknown
  validated: ValidateTemplateDraftResult
} {
  void input.text

  const rawDraft: unknown = structuredClone(goBasicExam)

  const validated = validateTemplateDraft({
    exam: rawDraft,
    template: structuredClone(minimalValidTemplate),
  })

  return { rawDraft, validated }
}
