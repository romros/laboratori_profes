import type { TemplateDraftSource } from './templateDraftSource'

import { simpleRuleBasedDraftSource } from './simpleRuleBasedDraftSource'

/**
 * Simulació local del futur adapter LLM: aquí s’ubicaria prompt, transport (p. ex. fetch) i parse a JSON.
 * **Cap API real, cap SDK, cap variable d’entorn** — només codi síncron reversible.
 *
 * Avui delega a `simpleRuleBasedDraftSource` per no duplicar un motor de regles (stub = frontera, no negoci).
 */
export function simulateLlmDraftFromText(text: string): unknown {
  return simpleRuleBasedDraftSource.getDraft({ text })
}

/** `TemplateDraftSource` que representa el seam “resposta LLM” abans d’integrar model real. */
export const llmTemplateDraftSourceStub: TemplateDraftSource = {
  getDraft({ text }): unknown {
    return simulateLlmDraftFromText(text)
  },
}
