/**
 * Builder del contracte de sortida `TemplateMappedAnswersResult`.
 *
 * Orquestra:
 *   detectTemplateQuestionAnchors → verifyScanMatchesTemplate
 *   → deriveAnswerZonesFromAnchors → cleanAnswerZoneLines
 *   → construcció de l'objecte final
 *
 * No fa OCR ni accedeix a disc. Rep les pàgines OCR ja processades.
 * No conté lògica de negoci més enllà d'orquestrar els serveis existents.
 */
import { detectTemplateQuestionAnchors } from '../../template-anchor-detection/detectTemplateQuestionAnchors'
import { verifyScanMatchesTemplate } from '../../template-verification/verifyScanMatchesTemplate'
import { deriveAnswerZonesFromAnchors } from '../deriveAnswerZonesFromAnchors'
import { cleanAnswerZoneLines } from '../cleanAnswerZoneText'
import type { TemplateQuestion } from '../../template-anchor-detection/types'
import type { OcrPageLines, AnswerZoneRange } from '../types'
import type {
  TemplateMappedAnswer,
  TemplateMappedAnswersResult,
} from '../../../domain/template-mapped-answers/templateMappedAnswers.schema'

/** Similarity per sota de la qual s'afegeix warning `low_similarity`. */
const LOW_SIMILARITY_THRESHOLD = 0.65

/** Nombre de línies per sobre del qual s'afegeix warning `long_range`. */
const LONG_RANGE_LINE_COUNT = 30

/**
 * Extreu les línies OCR d'un rang de resposta (multi-pàgina suportat).
 */
function extractZoneLines(zone: AnswerZoneRange, pageMap: Map<number, OcrPageLines>): string[] {
  const lines: string[] = []

  if (zone.start_page_index === zone.end_page_index) {
    const page = pageMap.get(zone.start_page_index)
    if (page) lines.push(...page.lines.slice(zone.start_line_index, zone.end_line_index + 1))
  } else {
    const startPage = pageMap.get(zone.start_page_index)
    if (startPage) lines.push(...startPage.lines.slice(zone.start_line_index))

    for (const [idx, page] of pageMap) {
      if (idx > zone.start_page_index && idx < zone.end_page_index) {
        lines.push(...page.lines)
      }
    }

    const endPage = pageMap.get(zone.end_page_index)
    if (endPage) lines.push(...endPage.lines.slice(0, zone.end_line_index + 1))
  }

  return lines.map((l) => l.trim()).filter((l) => l.length > 0)
}

/**
 * Compta quantes vegades apareix cada clau d'anchor (pàgina:línia).
 * Retorna un set amb les claus compartides (count > 1).
 */
function detectSharedAnchorKeys(
  detected: ReturnType<typeof detectTemplateQuestionAnchors>['detected'],
  pageMap: Map<number, OcrPageLines>,
): Set<string> {
  const keyCounts = new Map<string, number>()

  for (const anchor of detected) {
    const page = pageMap.get(anchor.page_index)
    const lineIdx = page ? page.lines.findIndex((l) => l.includes(anchor.matched_text)) : -1
    const key = `${anchor.page_index}:${lineIdx}`
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1)
  }

  const shared = new Set<string>()
  for (const [key, count] of keyCounts) {
    if (count > 1) shared.add(key)
  }
  return shared
}

/**
 * Construeix el resultat complet del layout mapping a partir de les pàgines OCR.
 *
 * @param templateQuestions - Preguntes del template (ordre definit l'ordre de sortida)
 * @param ocrPages - Pàgines OCR del document de l'alumne
 * @returns Resultat estructurat amb match global + resposta per pregunta
 */
export function buildTemplateMappedAnswers(
  templateQuestions: TemplateQuestion[],
  ocrPages: OcrPageLines[],
): TemplateMappedAnswersResult {
  // Prepara estructura de pàgines
  const pageMap = new Map<number, OcrPageLines>()
  for (const p of ocrPages) pageMap.set(p.pageIndex, p)

  const ocrPagesFlat = ocrPages.map((p) => ({ pageIndex: p.pageIndex, text: p.lines.join('\n') }))
  const allDocLines = ocrPages.flatMap((p) => p.lines)

  // Detecció d'anchors
  const { detected, not_found } = detectTemplateQuestionAnchors(templateQuestions, ocrPagesFlat)

  // Verificació de match global
  const verification = verifyScanMatchesTemplate(templateQuestions, detected, not_found)

  // Derivació de zones
  const zonesResult = deriveAnswerZonesFromAnchors(templateQuestions, detected, ocrPages)
  const zoneMap = new Map<string, AnswerZoneRange>()
  for (const z of zonesResult.zones) zoneMap.set(z.question_id, z)

  // Detecció d'anchors compartits
  const sharedAnchorKeys = detectSharedAnchorKeys(detected, pageMap)
  const anchorKeyByQuestionId = new Map<string, string>()
  for (const anchor of detected) {
    const page = pageMap.get(anchor.page_index)
    const lineIdx = page ? page.lines.findIndex((l) => l.includes(anchor.matched_text)) : -1
    anchorKeyByQuestionId.set(anchor.question_id, `${anchor.page_index}:${lineIdx}`)
  }

  // Índex d'anchors per question_id
  const anchorMap = new Map(detected.map((a) => [a.question_id, a]))

  // Construcció de la llista de preguntes mapades (en ordre del template)
  const questions: TemplateMappedAnswer[] = templateQuestions.map((q) => {
    const anchor = anchorMap.get(q.id)
    const zone = zoneMap.get(q.id)
    const isDetected = anchor !== undefined

    const warnings: TemplateMappedAnswer['warnings'] = []

    if (!isDetected) {
      warnings.push('not_detected')
    } else {
      if (anchor.similarity < LOW_SIMILARITY_THRESHOLD) warnings.push('low_similarity')

      const anchorKey = anchorKeyByQuestionId.get(q.id)
      if (anchorKey && sharedAnchorKeys.has(anchorKey)) warnings.push('anchor_shared')
    }

    let rawLines: string[] = []
    let cleanLines: string[] = []

    if (zone) {
      rawLines = extractZoneLines(zone, pageMap)
      cleanLines = cleanAnswerZoneLines(rawLines, allDocLines)

      const totalLines =
        zone.start_page_index === zone.end_page_index
          ? zone.end_line_index - zone.start_line_index + 1
          : rawLines.length
      if (totalLines > LONG_RANGE_LINE_COUNT) warnings.push('long_range')
    }

    return {
      question_id: q.id,
      is_detected: isDetected,
      match: {
        similarity: anchor?.similarity ?? 0,
        confidence: verification.confidence,
      },
      anchor: {
        page_index: anchor?.page_index ?? null,
        line_index: isDetected
          ? (pageMap
              .get(anchor!.page_index)
              ?.lines.findIndex((l) => l.includes(anchor!.matched_text)) ?? null)
          : null,
      },
      range: zone
        ? {
            start_page_index: zone.start_page_index,
            start_line_index: zone.start_line_index,
            end_page_index: zone.end_page_index,
            end_line_index: zone.end_line_index,
          }
        : {
            start_page_index: null,
            start_line_index: null,
            end_page_index: null,
            end_line_index: null,
          },
      answer_text_raw: rawLines.join('\n'),
      answer_text_clean: cleanLines.join('\n'),
      warnings,
    }
  })

  return {
    is_match: verification.is_match,
    confidence: verification.confidence,
    reason: verification.reason,
    questions,
  }
}
