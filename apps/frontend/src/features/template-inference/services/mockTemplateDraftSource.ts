import type { TemplateDraftSource } from '@/features/template-inference/services/templateDraftSource'

import { goBasicExam } from '../../../../fixtures/template-inference/go-basic'

/**
 * Font mock: retorna el fixture go-basic (sense interpretar `text`; reservat per futures adapters).
 */
export const mockTemplateDraftSource: TemplateDraftSource = {
  getDraft(input: { text: string }): unknown {
    void input.text
    return structuredClone(goBasicExam)
  },
}
