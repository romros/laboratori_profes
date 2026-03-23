/**
 * Extreu el context global del document del professor (text anterior al llistat de preguntes).
 *
 * Regla determinista:
 *   - Cerca el primer marcador de preguntes al text (p.ex. "Es demana:" o "Es demana\n").
 *   - Tot el que va ABANS d'aquest marcador és `pre_questions_text`.
 *   - Si no es troba cap marcador, retorna el text complet com a context.
 *
 * Guardrail explícit:
 *   - Aquest context serveix per contextualitzar (model relacional, restriccions globals,
 *     instruccions generals), NO per inventar criteris ni reescriure el spec base.
 */

/** Marcadors que indiquen l'inici del llistat de preguntes (primer match guanya). */
const QUESTION_SECTION_MARKERS = [
  /Es demana\s*:/i,
  /Es demana\s*\n/i,
  /^\s*1[.)]\s+/m, // primera pregunta numerada (fallback)
]

export type DocumentContextResult = {
  /** Text del preàmbul (model relacional, restriccions, instruccions). Pot ser buit "". */
  pre_questions_text: string
  /** Índex (caràcter) on comença el bloc de preguntes; -1 si no es va trobar cap marcador. */
  questions_start_index: number
}

/**
 * Parteix el text d'un document del professor en:
 * - context previ (model relacional, restriccions, etc.)
 * - inici del bloc de preguntes
 *
 * Useu el resultat `pre_questions_text` com a `examDocumentContext` a la passada 2.
 */
export function extractDocumentContext(text: string): DocumentContextResult {
  for (const marker of QUESTION_SECTION_MARKERS) {
    const match = marker.exec(text)
    if (match && match.index !== undefined) {
      const pre = text.slice(0, match.index).trim()
      return {
        pre_questions_text: pre,
        questions_start_index: match.index,
      }
    }
  }

  // Cap marcador trobat: tot és context (o text molt curt sense estructura clara)
  return {
    pre_questions_text: text.trim(),
    questions_start_index: -1,
  }
}
