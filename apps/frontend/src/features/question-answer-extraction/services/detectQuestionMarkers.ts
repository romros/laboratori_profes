export type QuestionMarkerHit = {
  question_id: string
  /** Índex al string combinat on comença el match. */
  index: number
  /** Longitud del match (per saltar el marcador en la segmentació). */
  matchLength: number
}

/**
 * Troba marcadors tipus `1.`, `2)`, `Pregunta 3` al text OCR (línies).
 */
export function findQuestionMarkers(fullText: string): QuestionMarkerHit[] {
  const hits: QuestionMarkerHit[] = []

  const numbered = /(?:^|\n)\s*(\d{1,2})\s*[.)]\s+/gm
  let m: RegExpExecArray | null
  while ((m = numbered.exec(fullText)) !== null) {
    hits.push({
      question_id: m[1],
      index: m.index,
      matchLength: m[0].length,
    })
  }

  const pregunta = /(?:^|\n)\s*Pregunta\s+(\d+)\b/gim
  while ((m = pregunta.exec(fullText)) !== null) {
    hits.push({
      question_id: m[1],
      index: m.index,
      matchLength: m[0].length,
    })
  }

  hits.sort((a, b) => a.index - b.index)

  const deduped: QuestionMarkerHit[] = []
  for (const h of hits) {
    const last = deduped[deduped.length - 1]
    if (last && Math.abs(h.index - last.index) < 4 && last.question_id === h.question_id) {
      continue
    }
    deduped.push(h)
  }

  return deduped
}
