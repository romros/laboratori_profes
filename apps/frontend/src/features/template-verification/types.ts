/** Resultat de la verificació de correspondència scan ↔ template. */
export type TemplateMatchVerification = {
  /** Indica si el scan correspon al template amb prou confiança per processar-lo. */
  is_match: boolean
  /** Confiança [0, 1]: fracció de preguntes detectades × score mig de similarity. */
  confidence: number
  detected_anchor_count: number
  expected_question_count: number
  matched_question_ids: string[]
  missing_question_ids: string[]
  /**
   * Motiu de la decisió:
   * - `enough_anchors_detected`: ≥ MIN_MATCH_RATIO de preguntes detectades → match
   * - `too_few_anchors`: ratio entre MIN_UNCERTAIN_RATIO i MIN_MATCH_RATIO → no match però OCR potser brut
   * - `wrong_exam`: ratio < MIN_UNCERTAIN_RATIO i/o similarity molt baix → examen diferent
   * - `ocr_too_noisy`: ratio acceptable però similarity mig massa baix → OCR massa brut per decidir
   */
  reason: 'enough_anchors_detected' | 'too_few_anchors' | 'wrong_exam' | 'ocr_too_noisy'
}
