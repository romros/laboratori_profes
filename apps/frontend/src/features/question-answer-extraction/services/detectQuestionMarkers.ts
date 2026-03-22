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

/**
 * Pas 2 (MVP): elimina marcadors duplicats del mateix `question_id` (capçalera/peu OCR).
 * Conservar la primera aparicio per cada question_id; descartar la resta (MVP pas 2).
 */
export function dedupeQuestionMarkersByFirstId(markers: QuestionMarkerHit[]): QuestionMarkerHit[] {
  const seen = new Set<string>()
  const out: QuestionMarkerHit[] = []
  for (const h of markers) {
    if (seen.has(h.question_id)) continue
    seen.add(h.question_id)
    out.push(h)
  }
  return out
}
