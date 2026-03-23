import type { DetectedQuestionAnchor } from '../template-anchor-detection/types'

/** Rang lògic de la zona de resposta d'una pregunta (en coordenades línia/pàgina). */
export type AnswerZoneRange = {
  question_id: string
  start_page_index: number
  /** Índex de línia dins la pàgina on comença la resposta (0-based, exclusiu: no inclou la línia d'anchor). */
  start_line_index: number
  end_page_index: number
  /** Índex de línia dins la pàgina on acaba la resposta (0-based, inclusiu). */
  end_line_index: number
  /** Score de l'anchor que ha originat el rang. */
  anchor_similarity: number
}

/** Text OCR estructurat per pàgina + línies. */
export type OcrPageLines = {
  pageIndex: number
  lines: string[]
}

/** Resultat complet de la derivació de zones. */
export type AnswerZonesResult = {
  zones: AnswerZoneRange[]
  /** IDs de preguntes no detectades (anchor absent → sense zona). */
  not_detected: string[]
  anchors: DetectedQuestionAnchor[]
}
