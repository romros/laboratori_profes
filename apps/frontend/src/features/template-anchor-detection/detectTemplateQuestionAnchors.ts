import { normalizeText } from './normalizeText'
import { scoreKeywordOverlap } from './scoreSimilarity'
import type {
  DetectedQuestionAnchor,
  TemplateAnchorDetectionResult,
  TemplateQuestion,
} from './types'

/**
 * Score mínim per considerar una detecció vàlida.
 * 0.5 = almenys la meitat de les paraules clau del template presents a la línia.
 */
const MIN_SIMILARITY = 0.5

/**
 * Longitud mínima d'una línia OCR per considerar-la candidata.
 * Evita matches espuris en línies molt curtes.
 */
const MIN_LINE_LENGTH = 10

type OcrPage = {
  pageIndex: number
  text: string
}

/**
 * Per a cada pregunta del template, cerca la millor línia OCR del document
 * que coincideixi amb l'enunciat (matching tolerant per overlap de paraules clau).
 *
 * @param templateQuestions - Preguntes del template (id + text de l'enunciat)
 * @param ocrPages - Text OCR per pàgina (pageIndex 1-based)
 * @returns Llista de matches detectats + IDs no trobats
 */
export function detectTemplateQuestionAnchors(
  templateQuestions: TemplateQuestion[],
  ocrPages: OcrPage[],
): TemplateAnchorDetectionResult {
  const detected: DetectedQuestionAnchor[] = []
  const not_found: string[] = []

  for (const question of templateQuestions) {
    const templateNorm = normalizeText(question.text)
    let bestScore = 0
    let bestAnchor: DetectedQuestionAnchor | null = null

    for (const page of ocrPages) {
      const lines = page.text.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.length < MIN_LINE_LENGTH) continue

        const lineNorm = normalizeText(trimmed)
        const score = scoreKeywordOverlap(templateNorm, lineNorm)

        if (score > bestScore) {
          bestScore = score
          bestAnchor = {
            question_id: question.id,
            page_index: page.pageIndex,
            matched_text: trimmed,
            similarity: Math.round(score * 100) / 100,
          }
        }
      }
    }

    if (bestAnchor && bestScore >= MIN_SIMILARITY) {
      detected.push(bestAnchor)
    } else {
      not_found.push(question.id)
    }
  }

  return { detected, not_found }
}
