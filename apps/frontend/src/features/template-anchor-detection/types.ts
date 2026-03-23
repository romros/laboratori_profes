/** Pregunta del template d'entrada (enunciat en lletra d'impremta). */
export type TemplateQuestion = {
  id: string
  text: string
}

/** Resultat de detecció d'un anchor per una pregunta del template. */
export type DetectedQuestionAnchor = {
  question_id: string
  /** Índex de pàgina (1-based, igual que page_indices del pipeline QAE). */
  page_index: number
  /** Fragment de text OCR que ha produït el match. */
  matched_text: string
  /** Score de similitud [0, 1]. */
  similarity: number
}

/** Resultat complet de la detecció per un document. */
export type TemplateAnchorDetectionResult = {
  detected: DetectedQuestionAnchor[]
  /** IDs de preguntes que no s'han pogut detectar (similarity < llindar). */
  not_found: string[]
}
