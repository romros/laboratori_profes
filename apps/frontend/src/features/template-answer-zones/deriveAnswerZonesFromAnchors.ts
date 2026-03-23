import type { DetectedQuestionAnchor, TemplateQuestion } from '../template-anchor-detection/types'
import { normalizeText } from '../template-anchor-detection/normalizeText'
import { scoreKeywordOverlap } from '../template-anchor-detection/scoreSimilarity'
import { isGraphicalAnswer } from './isGraphicalAnswer'
import type { AnswerZoneRange, AnswerZonesResult, OcrPageLines } from './types'

/**
 * Troba l'índex de línia dins una pàgina que correspon millor a un anchor.
 * Retorna -1 si no es troba cap línia amb score acceptable.
 */
function findAnchorLineIndex(anchor: DetectedQuestionAnchor, pageLines: OcrPageLines): number {
  const templateNorm = normalizeText(anchor.matched_text)
  let bestIdx = -1
  let bestScore = 0

  for (let i = 0; i < pageLines.lines.length; i++) {
    const lineNorm = normalizeText(pageLines.lines[i]!)
    const score = scoreKeywordOverlap(templateNorm, lineNorm)
    if (score > bestScore) {
      bestScore = score
      bestIdx = i
    }
  }
  return bestScore > 0.4 ? bestIdx : -1
}

/**
 * Deriva zones lògiques de resposta a partir dels anchors detectats.
 *
 * Heurística:
 * - La resposta d'una pregunta comença a la línia SEGÜENT a l'anchor.
 * - La resposta acaba a la línia ANTERIOR a l'anchor de la pregunta SEGÜENT.
 * - Si no hi ha anchor següent, la zona s'estén fins al final del document.
 * - Suporta salts de pàgina entre una resposta i la seva fi.
 *
 * @param templateQuestions - Llista ordenada de preguntes del template (defineix l'ordre)
 * @param anchors - Anchors detectats per `detectTemplateQuestionAnchors`
 * @param ocrPages - Text OCR per pàgina dividit en línies
 */
export function deriveAnswerZonesFromAnchors(
  templateQuestions: TemplateQuestion[],
  anchors: DetectedQuestionAnchor[],
  ocrPages: OcrPageLines[],
): AnswerZonesResult {
  // Mapa pàgina → línies per accés ràpid
  const pageMap = new Map<number, OcrPageLines>()
  for (const p of ocrPages) pageMap.set(p.pageIndex, p)

  // Índex d'anchor per question_id
  const anchorMap = new Map<string, DetectedQuestionAnchor>()
  for (const a of anchors) anchorMap.set(a.question_id, a)

  // Només preguntes amb anchor detectat, en ordre del template
  const detectedQuestions = templateQuestions.filter((q) => anchorMap.has(q.id))
  const not_detected = templateQuestions.filter((q) => !anchorMap.has(q.id)).map((q) => q.id)

  // Posició absoluta de cada anchor (pàgina + línia)
  type AnchorPos = { questionId: string; pageIndex: number; lineIndex: number; similarity: number }
  const anchorPositions: AnchorPos[] = []

  for (const q of detectedQuestions) {
    const anchor = anchorMap.get(q.id)!
    const page = pageMap.get(anchor.page_index)
    if (!page) continue

    const lineIdx = findAnchorLineIndex(anchor, page)
    anchorPositions.push({
      questionId: q.id,
      pageIndex: anchor.page_index,
      lineIndex: lineIdx >= 0 ? lineIdx : 0,
      similarity: anchor.similarity,
    })
  }

  // Posició del final del document
  const lastPage = ocrPages[ocrPages.length - 1]
  const docEndPage = lastPage?.pageIndex ?? 1
  const docEndLine = (lastPage?.lines.length ?? 1) - 1

  // Derivar rang per cada anchor
  const zones: AnswerZoneRange[] = []

  for (let i = 0; i < anchorPositions.length; i++) {
    const current = anchorPositions[i]!
    const next = anchorPositions[i + 1]

    // Inici: línia immediatament posterior a l'anchor
    const startPage = current.pageIndex
    const currentPage = pageMap.get(current.pageIndex)
    const linesInCurrentPage = currentPage?.lines.length ?? 1
    let startLine = current.lineIndex + 1

    // Si l'anchor és l'última línia de la pàgina, comencem a la pàgina següent
    let resolvedStartPage = startPage
    if (startLine >= linesInCurrentPage) {
      const nextPageIdx = ocrPages.findIndex((p) => p.pageIndex > startPage)
      if (nextPageIdx >= 0) {
        resolvedStartPage = ocrPages[nextPageIdx]!.pageIndex
        startLine = 0
      } else {
        startLine = linesInCurrentPage - 1
      }
    }

    // Fi: línia anterior a l'anchor de la pregunta següent (o final del document)
    let endPage: number
    let endLine: number

    if (next) {
      // El final és just abans del proper anchor
      if (next.lineIndex > 0) {
        endPage = next.pageIndex
        endLine = next.lineIndex - 1
      } else {
        // L'anchor següent és a la primera línia: fi = última línia de la pàgina anterior
        const prevPageEntry = ocrPages
          .slice()
          .reverse()
          .find((p) => p.pageIndex < next.pageIndex)
        if (prevPageEntry) {
          endPage = prevPageEntry.pageIndex
          endLine = prevPageEntry.lines.length - 1
        } else {
          endPage = next.pageIndex
          endLine = 0
        }
      }
    } else {
      endPage = docEndPage
      endLine = docEndLine
    }

    // Punt d'extensió de privadesa: diferenciació textual vs gràfic.
    // Veure docs/privacy/PRIVACY_ARCHITECTURE.md §8 i isGraphicalAnswer.ts.
    const question = templateQuestions.find((q) => q.id === current.questionId)
    if (question && isGraphicalAnswer(question)) {
      // FUTUR: possible enviament de crop mínim (REVISAR PRIVACY_ARCHITECTURE §8)
      // Requereix decisió de PM + condicions estrictes (local inviable, config explícita,
      // crop limitat a la zona, no persistit, eliminació immediata).
      // Per ara: tractament idèntic al textual (local).
    }
    // else: mai enviar imatge — tractament local sempre.

    zones.push({
      question_id: current.questionId,
      start_page_index: resolvedStartPage,
      start_line_index: startLine,
      end_page_index: endPage,
      end_line_index: endLine,
      anchor_similarity: current.similarity,
    })
  }

  return { zones, not_detected, anchors }
}
