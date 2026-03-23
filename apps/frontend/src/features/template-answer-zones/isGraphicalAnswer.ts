/**
 * Diferenciació formal entre respostes textuals i gràfiques.
 *
 * Contracte de privadesa (veure docs/privacy/PRIVACY_ARCHITECTURE.md §8):
 *
 * - Respostes TEXTUALS → processament local sempre. Mai enviar imatge a cap servei extern.
 * - Respostes GRÀFIQUES → poden requerir enviament de crop mínim en futur,
 *   únicament amb condicions estrictes (local inviable, config explícita, crop limitat,
 *   no persistit). Cap implementació d'aquest flux existeix ara.
 *
 * Ús en el pipeline:
 *
 * ```ts
 * if (isGraphicalAnswer(question)) {
 *   // FUTUR: possible enviament de crop mínim (REVISAR PRIVACY_ARCHITECTURE §8)
 *   // Requereix decisió de PM + actualització de SELF_AUDIT.md
 * } else {
 *   // SEMPRE local. Mai enviar imatge.
 * }
 * ```
 */
import type { TemplateQuestion } from '../template-anchor-detection/types'

/**
 * Retorna `true` si la pregunta requereix tractament de resposta gràfica.
 *
 * Una pregunta és gràfica si:
 * - `question.type === 'diagram'`, o
 * - `question.tags` inclou `'graphical'`
 *
 * Per defecte (sense `type` ni `tags`) → `false` → tractament textual local.
 * Conservador: en cas de dubte, local.
 */
export function isGraphicalAnswer(question: TemplateQuestion): boolean {
  if (question.type === 'diagram') return true
  if (question.tags?.includes('graphical')) return true
  return false
}
