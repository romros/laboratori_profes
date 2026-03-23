import { keywordsOf } from './normalizeText'

/**
 * Score de similitud entre un enunciat del template i una línia OCR.
 *
 * Estratègia: overlap de paraules clau (≥4 chars).
 * - Compta quantes keywords del template apareixen (includes) a la línia OCR.
 * - Normalitza per nombre de keywords del template.
 * - Tolerant a soroll OCR: no exigeix match exacte de la línia sencera.
 *
 * Retorna [0, 1].
 */
export function scoreKeywordOverlap(templateNormalized: string, lineNormalized: string): number {
  const keywords = keywordsOf(templateNormalized)
  if (keywords.length === 0) return 0

  let hits = 0
  for (const kw of keywords) {
    if (lineNormalized.includes(kw)) hits++
  }
  return hits / keywords.length
}
