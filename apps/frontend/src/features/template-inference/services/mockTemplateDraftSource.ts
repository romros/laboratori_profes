import type { TemplateDraftSource } from './templateDraftSource'

import { templateClearViableDraft } from '../../../../fixtures/template-inference/template-clear-viable'

/**
 * Font mock: retorna plantilla viable fixa (sense interpretar `text`).
 */
export const mockTemplateDraftSource: TemplateDraftSource = {
  getDraft(input: { text: string }): unknown {
    void input.text
    return structuredClone(templateClearViableDraft)
  },
}
