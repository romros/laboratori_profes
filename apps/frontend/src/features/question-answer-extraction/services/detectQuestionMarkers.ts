export type QuestionMarkerHit = {
  question_id: string
  /** Índex al string combinat on comença el match. */
  index: number
  /** Longitud del match (per saltar el marcador en la segmentació). */
  matchLength: number
}

/**
 * Paraules que típicament inicien un enunciat de pregunta d'examen SQL/BD.
 * Usat pel regex tolerant (sense punt/parèntesi) per evitar falsos positius
 * amb números solts al text OCR.
 */
const QUESTION_STEM_WORDS =
  'Creaci|Inserir|Assignar|Registrar|Esborrar|Canviar|Afegir|Definir|Incrementar|Modificar|Eliminar|Actualitzar|Llistar|Mostrar|Consultar'

/**
 * Troba marcadors de pregunta al text OCR.
 *
 * Tres nivells de detecció (de més estricte a més tolerant):
 * 1. `N.` / `N)` — regex clàssic, molt fiable
 * 2. `Pregunta N` — patró explícit
 * 3. `N <paraula d'enunciat>` — fallback tolerant quan l'OCR perd el punt;
 *    només accepta si la paraula següent és un verb/nom típic d'inici de pregunta
 *    per evitar falsos positius amb números solts
 */
export function findQuestionMarkers(fullText: string): QuestionMarkerHit[] {
  const hits: QuestionMarkerHit[] = []

  // Nivell 1: N. o N) (estricte)
  const numbered = /(?:^|\n)\s*(\d{1,2})\s*[.)]\s+/gm
  let m: RegExpExecArray | null
  while ((m = numbered.exec(fullText)) !== null) {
    hits.push({
      question_id: m[1],
      index: m.index,
      matchLength: m[0].length,
    })
  }

  // Nivell 2: "Pregunta N"
  const pregunta = /(?:^|\n)\s*Pregunta\s+(\d+)\b/gim
  while ((m = pregunta.exec(fullText)) !== null) {
    hits.push({
      question_id: m[1],
      index: m.index,
      matchLength: m[0].length,
    })
  }

  // Nivell 3: N seguit de paraula d'enunciat (tolerant a OCR sense punt)
  const tolerant = new RegExp(
    `(?:^|\\n)\\s*(\\d{1,2})\\s+(?:de\\s+)?(?:${QUESTION_STEM_WORDS})`,
    'gim',
  )
  while ((m = tolerant.exec(fullText)) !== null) {
    hits.push({
      question_id: m[1],
      index: m.index,
      matchLength: m[0].length,
    })
  }

  hits.sort((a, b) => a.index - b.index)

  // Deduplicar hits molt propers del mateix question_id (mateixa posició, regex diferent)
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
