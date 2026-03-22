import type { QuestionAnswerExtractionSpikeItem } from '../types/spikeTypes'

import type { QuestionMarkerHit } from './detectQuestionMarkers'

const MIN_EMPTY_CHARS = 8

/** Blocs massa llargs: tall suau a canvi de pàgina o paràgraf (spike pas 2) per evitar segments gegants. */
const MAX_SLICE_CHARS_BEFORE_SOFT_SPLIT = 2800

/** Proporció mínima del límit on acceptar un tall per pàgina o paràgraf. */
const MIN_HEAD_FRACTION_FOR_SPLIT = 0.35

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

const BOILERPLATE_LINE =
  /^(Generalitat|INS |Departament|AVALUACI|III |ALL INS|©|page\s+\d|P[àa]g[ri][ne]a?\s+\d|Es demana)/i

/** Treu línies finals típiques de peu de pàgina institucional (OCR repetit). */
export function stripTrailingBoilerplateLines(s: string): string {
  const lines = s.split('\n')
  while (lines.length > 0) {
    const L = lines[lines.length - 1]?.trim() ?? ''
    if (L.length === 0) {
      lines.pop()
      continue
    }
    if (BOILERPLATE_LINE.test(L)) {
      lines.pop()
      continue
    }
    break
  }
  return lines.join('\n').trim()
}

/**
 * Si el tall entre marcadors és massa llarg, talla abans del darrer límit de pàgina
 * o paràgraf doble dins del límit, i afegeix nota explícita (sense NLP).
 */
export function truncateOversizedSlice(slice: string): string {
  if (slice.length <= MAX_SLICE_CHARS_BEFORE_SOFT_SPLIT) return slice

  const head = slice.slice(0, MAX_SLICE_CHARS_BEFORE_SOFT_SPLIT)
  const minPos = Math.floor(MAX_SLICE_CHARS_BEFORE_SOFT_SPLIT * MIN_HEAD_FRACTION_FOR_SPLIT)

  const pageBreak = head.lastIndexOf('\n<<<PAGE ')
  if (pageBreak >= minPos) {
    return `${head.slice(0, pageBreak).trimEnd()}\n\n[… spike pas 2: tall al canvi de pàgina (límit mida) …]`
  }

  const paraBreak = head.lastIndexOf('\n\n')
  if (paraBreak >= minPos) {
    return `${head.slice(0, paraBreak).trimEnd()}\n\n[… spike pas 2: tall en blanc doble (límit mida) …]`
  }

  return `${head.trimEnd()}\n\n[… spike pas 2: tall per límit d extensio sense tall net …]`
}

function classifyBlock(raw: string): QuestionAnswerExtractionSpikeItem['status'] {
  const t = stripPageTags(raw)
  if (t.length < MIN_EMPTY_CHARS) return 'empty'
  const letters = t.replace(/[^a-zA-ZàèéíòóúüÀÈÉÍÒÓÚÜñÑçÇ]/g, '').length
  if (letters < Math.max(6, t.length * 0.12)) return 'unsupported'
  return 'ok'
}

/**
 * Detecta si una línia és part de l'enunciat de la pregunta (text imprès del professor).
 *
 * Senyals: conté puntuació entre parèntesis `(X punts)` / `(X,XX punts)` / `(X,XX pu`
 * (OCR brut pot tallar "punts"). La puntuació és el senyal més fiable perquè apareix
 * al text imprès de l'enunciat i gairebé mai a la resposta manuscrita.
 */
const SCORE_PATTERN = /\(\s*\d+[.,]\d*\s*p/i

/**
 * Elimina les primeres línies d'un bloc que són clarament l'enunciat de la pregunta.
 *
 * Estratègia conservadora:
 * - Busca el patró de puntuació `(X punts)` a les primeres MAX_STATEMENT_LINES línies
 * - Talla fins a la línia que conté el patró (inclosa), ja que l'enunciat sol acabar allà
 * - Si treure les línies deixa menys de MIN_ANSWER_CHARS, conserva tot (no arriscar)
 *
 * Exemples de línies d'enunciat (poden ocupar 1 o 2 línies):
 *   "Creació de la taula Biblioteca amb les restriccions corresponents. (0.75 punts)"
 *   "Inserir un hospital amb codi 1 ubicat al carrer Sant Joan,\nnúmero 50, ... (0,33 punts)"
 */
const MIN_ANSWER_CHARS = 20
const MAX_STATEMENT_LINES = 4

export function stripLeadingQuestionStatement(block: string): string {
  const lines = block.split('\n')

  // Busca la darrera línia dins les primeres MAX_STATEMENT_LINES que conté puntuació
  let cutTo = 0
  const limit = Math.min(lines.length, MAX_STATEMENT_LINES)
  for (let i = 0; i < limit; i++) {
    if (SCORE_PATTERN.test(lines[i])) {
      cutTo = i + 1
    }
  }

  if (cutTo === 0) return block

  const rest = lines.slice(cutTo).join('\n').trim()
  // Conservador: si el que queda és massa curt, no tallar
  if (rest.length < MIN_ANSWER_CHARS) return block

  return rest
}

/**
 * Segmenta el text entre marcadors; aplica truncament suau, neteja de peus,
 * i eliminació de l'enunciat inicial de cada bloc.
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
    let slice = fullText.slice(start, end)
    slice = truncateOversizedSlice(slice)
    let raw_text_block = stripTrailingBoilerplateLines(stripPageTags(slice))
    raw_text_block = stripLeadingQuestionStatement(raw_text_block)
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
