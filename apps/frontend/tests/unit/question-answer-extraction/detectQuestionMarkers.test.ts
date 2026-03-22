import { describe, expect, it } from 'vitest'

import { findQuestionMarkers } from '../../../src/features/question-answer-extraction/services/detectQuestionMarkers'
import { segmentByQuestionMarkers } from '../../../src/features/question-answer-extraction/services/segmentByQuestionMarkers'

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
})
