import type { DetectedQuestionAnchor, TemplateQuestion } from '../template-anchor-detection/types'
import type { TemplateMatchVerification } from './types'

/**
 * Fracció mínima de preguntes detectades per considerar el scan com a match.
 * Ex: 15 preguntes → cal detectar almenys 9 (60%) per acceptar.
 *
 * Racional: un examen equivocat pot tenir algunes paraules clau en comú per atzar
 * (noms de taules com "Hospital", "Pacient" podrien aparèixer en altres exàmens SQL),
 * però és molt improbable que superin el 60% amb bona similarity.
 */
const MIN_MATCH_RATIO = 0.6

/**
 * Fracció per sota de la qual considerem directament "wrong_exam".
 * Entre MIN_UNCERTAIN_RATIO i MIN_MATCH_RATIO → "too_few_anchors" (potser OCR brut).
 */
const MIN_UNCERTAIN_RATIO = 0.3

/**
 * Score mig de similarity mínim per confiar en la detecció.
 * Evita el cas on molts anchors es "detecten" amb scores molt baixos (0.5 just al llindar)
 * per atzar de paraules comunes.
 */
const MIN_AVG_SIMILARITY = 0.55

/**
 * Verifica si un scan OCR correspon al template donat.
 *
 * Heurística (simple, documentada, conservadora):
 * 1. Calcula el rati de preguntes detectades: detected / total
 * 2. Calcula el score mig de similarity dels anchors detectats
 * 3. Decideix:
 *    - rati ≥ MIN_MATCH_RATIO i avg_sim ≥ MIN_AVG_SIMILARITY → is_match=true, reason='enough_anchors_detected'
 *    - rati ≥ MIN_MATCH_RATIO però avg_sim < MIN_AVG_SIMILARITY → is_match=false, reason='ocr_too_noisy'
 *    - MIN_UNCERTAIN_RATIO ≤ rati < MIN_MATCH_RATIO → is_match=false, reason='too_few_anchors'
 *    - rati < MIN_UNCERTAIN_RATIO → is_match=false, reason='wrong_exam'
 *
 * Conservador per disseny: preferim fals negatiu (rebutjar un examen vàlid) a fals positiu
 * (acceptar un examen equivocat que contaminaria el pipeline de mapping).
 *
 * @param templateQuestions - Llista de preguntes del template (defineix el total esperat)
 * @param anchors - Anchors detectats per `detectTemplateQuestionAnchors`
 * @param notFound - IDs de preguntes no trobades (de `TemplateAnchorDetectionResult.not_found`)
 */
export function verifyScanMatchesTemplate(
  templateQuestions: TemplateQuestion[],
  anchors: DetectedQuestionAnchor[],
  notFound: string[],
): TemplateMatchVerification {
  const expectedCount = templateQuestions.length
  const detectedCount = anchors.length

  const matchedIds = anchors.map((a) => a.question_id)
  const missingIds = notFound

  const detectionRatio = expectedCount > 0 ? detectedCount / expectedCount : 0

  const avgSimilarity =
    detectedCount > 0 ? anchors.reduce((sum, a) => sum + a.similarity, 0) / detectedCount : 0

  // Confiança = rati de detecció × similarity mitjana (ambdós factoren)
  const confidence = Math.round(detectionRatio * avgSimilarity * 100) / 100

  let is_match: boolean
  let reason: TemplateMatchVerification['reason']

  if (detectionRatio >= MIN_MATCH_RATIO) {
    if (avgSimilarity >= MIN_AVG_SIMILARITY) {
      is_match = true
      reason = 'enough_anchors_detected'
    } else {
      is_match = false
      reason = 'ocr_too_noisy'
    }
  } else if (detectionRatio >= MIN_UNCERTAIN_RATIO) {
    is_match = false
    reason = 'too_few_anchors'
  } else {
    is_match = false
    reason = 'wrong_exam'
  }

  return {
    is_match,
    confidence,
    detected_anchor_count: detectedCount,
    expected_question_count: expectedCount,
    matched_question_ids: matchedIds,
    missing_question_ids: missingIds,
    reason,
  }
}
