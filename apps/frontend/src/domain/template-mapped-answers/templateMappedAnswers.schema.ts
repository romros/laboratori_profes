/**
 * Contracte de sortida del layout mapping: representació oficial de
 * "què ha respost l'alumne per cada pregunta del template".
 *
 * Estable i consumible per futures features (scoring, export, UI final).
 * No conté lògica ni intel·ligència — només dades.
 *
 * Veure: docs/features/question-answer-extraction/README.md
 */

/**
 * Resposta mapada per a una pregunta concreta del template.
 */
export type TemplateMappedAnswer = {
  /** Identificador de la pregunta (del template). */
  question_id: string

  /** Si l'anchor de la pregunta s'ha detectat al document. */
  is_detected: boolean

  /**
   * Informació de qualitat de la detecció.
   * Ambdós camps són 0 quan `is_detected` és false.
   */
  match: {
    /** Similitud de l'anchor [0, 1]. 0 si no detectat. */
    similarity: number
    /** Confiança global del match del document [0, 1]. */
    confidence: number
  }

  /**
   * Posició de l'anchor dins el document.
   * Tots null quan `is_detected` és false.
   */
  anchor: {
    page_index: number | null
    line_index: number | null
  }

  /**
   * Rang lògic de la zona de resposta (coordenades línia/pàgina).
   * Tots null quan `is_detected` és false (sense anchor → sense rang).
   */
  range: {
    start_page_index: number | null
    start_line_index: number | null
    end_page_index: number | null
    end_line_index: number | null
  }

  /** Text OCR brut de la zona de resposta (línies unides per \n). */
  answer_text_raw: string

  /** Text net de la zona de resposta (boilerplate eliminat). */
  answer_text_clean: string

  /**
   * Avisos sobre la qualitat d'aquesta pregunta concreta.
   *
   * Valors possibles:
   * - `'not_detected'`: cap anchor trobat → rang i text buits
   * - `'low_similarity'`: anchor detectat però similarity < 0.65
   * - `'anchor_shared'`: l'anchor és compartit amb una altra pregunta
   * - `'long_range'`: rang > 30 línies (possible error de detecció o document molt llarg)
   */
  warnings: Array<'not_detected' | 'low_similarity' | 'anchor_shared' | 'long_range'>
}

/**
 * Resultat global del layout mapping d'un document.
 *
 * Conté la decisió de match + totes les preguntes del template
 * amb el seu rang i text de resposta.
 */
export type TemplateMappedAnswersResult = {
  /** Si el document correspon al template (ratio anchors + similarity). */
  is_match: boolean

  /** Confiança global [0, 1]: fracció detectada × similarity mitjana. */
  confidence: number

  /**
   * Motiu de la decisió de match:
   * - `'enough_anchors_detected'`: ≥ 60% preguntes detectades amb similarity acceptable
   * - `'too_few_anchors'`: 30–60% detectades
   * - `'wrong_exam'`: < 30% detectades
   * - `'ocr_too_noisy'`: ratio ok però similarity massa baixa
   */
  reason: 'enough_anchors_detected' | 'too_few_anchors' | 'wrong_exam' | 'ocr_too_noisy'

  /** Resposta mapada per cada pregunta del template, en ordre del template. */
  questions: TemplateMappedAnswer[]
}
