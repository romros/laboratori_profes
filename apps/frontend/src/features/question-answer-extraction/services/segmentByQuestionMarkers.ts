import type { QuestionAnswerExtractionSpikeItem } from '../types/spikeTypes'

import type { QuestionMarkerHit } from './detectQuestionMarkers'

const MIN_EMPTY_CHARS = 8

/** Darrer sentinel <<<PAGE n>>> abans de `index` (per defecte 1). */
function lastPageBefore(fullText: string, index: number): number {
  const before = fullText.slice(0, index)
  let last = 1
  const re = /<<<PAGE (\d+)>>>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(before)) !== null) {
    last = parseInt(m[1], 10)
  }
  return last
}

function pagesInSlice(slice: string): number[] {
  const pages = new Set<number>()
  const re = /<<<PAGE (\d+)>>>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(slice)) !== null) {
    pages.add(parseInt(m[1], 10))
  }
  return [...pages].sort((a, b) => a - b)
}

function stripPageTags(s: string): string {
  return s
    .replace(/<<<PAGE \d+>>>/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function classifyBlock(raw: string): QuestionAnswerExtractionSpikeItem['status'] {
  const t = stripPageTags(raw)
  if (t.length < MIN_EMPTY_CHARS) return 'empty'
  const letters = t.replace(/[^a-zA-ZàèéíòóúüÀÈÉÍÒÓÚÜñÑçÇ]/g, '').length
  if (letters < Math.max(6, t.length * 0.12)) return 'unsupported'
  return 'ok'
}

/**
 * Segmenta el text entre un marcador i el següent; infereix `page_indices` via sentinels `<<<PAGE n>>>`.
 */
export function segmentByQuestionMarkers(
  fullText: string,
  markers: QuestionMarkerHit[],
): QuestionAnswerExtractionSpikeItem[] {
  if (markers.length === 0) return []

  const items: QuestionAnswerExtractionSpikeItem[] = []
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index + markers[i].matchLength
    const end = i + 1 < markers.length ? markers[i + 1].index : fullText.length
    const slice = fullText.slice(start, end)
    const raw_text_block = stripPageTags(slice)
    const fromSentinels = pagesInSlice(slice)
    const startPage = lastPageBefore(fullText, markers[i].index)
    const pageSet = new Set<number>([startPage, ...fromSentinels])
    const page_indices = [...pageSet].sort((a, b) => a - b)
    items.push({
      question_id: markers[i].question_id,
      status: classifyBlock(slice),
      raw_text_block,
      page_indices,
    })
  }
  return items
}
