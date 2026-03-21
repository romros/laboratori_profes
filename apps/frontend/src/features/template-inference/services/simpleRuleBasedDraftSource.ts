import type { TemplateDraftSource } from '@/features/template-inference/services/templateDraftSource'

import { goBasicExam } from '../../../../fixtures/template-inference/go-basic'

/** Llindar mínim de caràcters (regla trivial; sense semàntica de domini). */
const MIN_TEXT_CHARS = 10

/**
 * Simulació determinista d’entrada text → draft brut (sense API ni aleatorietat).
 * Només retorna payloads d’examen (`unknown`); **validateTemplateDraft** decideix apte / no_apte.
 *
 * Regles (màxim simplicitat):
 * - text buit o massa curt → objecte buit (fallida d’esquema al validator)
 * - presència de `???` → mateix perfil que go-basic però amb dubte §6 (fail-closed)
 * - altrament → go-basic
 */
export const simpleRuleBasedDraftSource: TemplateDraftSource = {
  getDraft({ text }): unknown {
    if (!text || text.length < MIN_TEXT_CHARS) {
      return {}
    }
    if (text.includes('???')) {
      return structuredClone({
        ...goBasicExam,
        doubt_on_seminanonimitzable: true,
      })
    }
    return structuredClone(goBasicExam)
  },
}
