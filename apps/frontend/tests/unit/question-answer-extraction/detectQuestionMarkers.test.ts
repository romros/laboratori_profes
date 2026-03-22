import { describe, expect, it } from 'vitest'

import {
  dedupeQuestionMarkersByFirstId,
  findQuestionMarkers,
  type QuestionMarkerHit,
} from '../../../src/features/question-answer-extraction/services/detectQuestionMarkers'
import {
  segmentByQuestionMarkers,
  stripTrailingBoilerplateLines,
  truncateOversizedSlice,
} from '../../../src/features/question-answer-extraction/services/segmentByQuestionMarkers'

describe('findQuestionMarkers', () => {
  it('detecta numeracio 1. 2) i Pregunta N', () => {
    const text = `
<<<PAGE 1>>>
1. Primera resposta amb text suficient per passar el llindar minim.
2) Segona amb contingut també vàlid aquí.
Pregunta 3 Encara més text per la tercera part.
`
    const m = findQuestionMarkers(text)
    expect(m.map((x) => x.question_id)).toEqual(['1', '2', '3'])
  })
})

describe('dedupeQuestionMarkersByFirstId', () => {
  it('conserva nomes la primera aparicio per question_id', () => {
    const markers: QuestionMarkerHit[] = [
      { question_id: '1', index: 10, matchLength: 3 },
      { question_id: '8', index: 100, matchLength: 3 },
      { question_id: '8', index: 5000, matchLength: 3 },
      { question_id: '9', index: 6000, matchLength: 3 },
    ]
    const d = dedupeQuestionMarkersByFirstId(markers)
    expect(d.map((x) => x.question_id)).toEqual(['1', '8', '9'])
  })
})

describe('stripTrailingBoilerplateLines', () => {
  it('elimina peus institucionals tipics', () => {
    const s = 'Resposta SQL aqui.\n\nGeneralitat de Catalunya'
    expect(stripTrailingBoilerplateLines(s)).toBe('Resposta SQL aqui.')
  })
})

describe('truncateOversizedSlice', () => {
  it('talla en limit de caracters amb nota si cal', () => {
    const filler = 'x'.repeat(5000)
    const out = truncateOversizedSlice(filler)
    expect(out.length).toBeLessThan(filler.length)
    expect(out).toMatch(/spike pas 2/)
  })

  it('prefereix tall abans de canvi de pagina dins del limit', () => {
    const a = 'a'.repeat(2000)
    const b = 'b'.repeat(2000)
    const slice = `${a}\n<<<PAGE 2>>>\n${b}`
    const out = truncateOversizedSlice(slice)
    expect(out).toMatch(/canvi de pàgina|tall al canvi/)
    expect(out).not.toContain('bbbb')
    expect(out.length).toBeLessThan(slice.length)
  })
})

describe('segmentByQuestionMarkers', () => {
  it('assigna page_indices i extreu blocs', () => {
    const text = `
<<<PAGE 1>>>
1. Resposta llarga prou bona per ser ok.
<<<PAGE 2>>>
2. Una altra resposta amb text vàlid aquí.
`
    const markers = findQuestionMarkers(text)
    const items = segmentByQuestionMarkers(text, markers)
    expect(items).toHaveLength(2)
    expect(items[0].question_id).toBe('1')
    expect(items[0].page_indices.sort((a, b) => a - b)).toEqual([1, 2])
    expect(items[0].status).toBe('ok')
    expect(items[1].question_id).toBe('2')
    expect(items[1].page_indices).toContain(2)
  })

  it('pipeline amb deduplicacio: una entrada per question_id repetit', () => {
    const text = `
<<<PAGE 1>>>
8. Primera vuit.
<<<PAGE 2>>>
8. Duplicat peu OCR vuit.
9. Nove.
`
    const raw = findQuestionMarkers(text)
    const markers = dedupeQuestionMarkersByFirstId(raw)
    expect(raw.length).toBeGreaterThan(markers.length)
    const items = segmentByQuestionMarkers(text, markers)
    const ids = items.map((i) => i.question_id)
    expect(ids.filter((x) => x === '8')).toHaveLength(1)
    expect(ids).toContain('9')
  })
})
