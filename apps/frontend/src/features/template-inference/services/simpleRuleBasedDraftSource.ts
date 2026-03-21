import type { TemplateDraftSource } from './templateDraftSource'

import {
  FIXTURE_SENTINEL_AMBIGUOUS,
  FIXTURE_SENTINEL_REGRESSION_TWO_OPEN_ONLY,
  FIXTURE_SENTINEL_SEMI_STRUCTURED,
} from '../../../../fixtures/template-inference/feature0-canonical-text'
import { templateClearViableDraft } from '../../../../fixtures/template-inference/template-clear-viable'
import { templateKoMixedPromptDraft } from '../../../../fixtures/template-inference/template-ko-mixed-prompt'
import { templateKoUnstableLayoutDraft } from '../../../../fixtures/template-inference/template-ko-unstable-layout'

/** Llindar mínim de caràcters (regla trivial; sense semàntica de domini). */
const MIN_TEXT_CHARS = 10

/**
 * Simulació determinista d’entrada text → esborrany de viabilitat de plantilla (`unknown`).
 * **validateTemplateFeasibility** decideix `ok` / `ko`.
 *
 * Sentinels `FIXTURE_SENTINEL_*`: només per proves canòniques (veure `feature0-canonical-text.ts`).
 */
export const simpleRuleBasedDraftSource: TemplateDraftSource = {
  getDraft({ text }): unknown {
    if (!text || text.length < MIN_TEXT_CHARS) {
      return {}
    }
    if (text.includes(FIXTURE_SENTINEL_REGRESSION_TWO_OPEN_ONLY)) {
      return structuredClone(templateKoMixedPromptDraft)
    }
    if (text.includes(FIXTURE_SENTINEL_SEMI_STRUCTURED)) {
      return structuredClone(templateKoUnstableLayoutDraft)
    }
    if (text.includes('???') || text.includes(FIXTURE_SENTINEL_AMBIGUOUS)) {
      return structuredClone(templateKoMixedPromptDraft)
    }
    return structuredClone(templateClearViableDraft)
  },
}
