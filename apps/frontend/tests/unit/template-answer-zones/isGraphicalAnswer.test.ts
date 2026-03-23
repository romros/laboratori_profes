import { describe, it, expect } from 'vitest'

import { isGraphicalAnswer } from '../../../src/features/template-answer-zones/isGraphicalAnswer'
import type { TemplateQuestion } from '../../../src/features/template-anchor-detection/types'

describe('isGraphicalAnswer', () => {
  it('retorna false per pregunta sense type ni tags (per defecte textual)', () => {
    const q: TemplateQuestion = { id: 'Q1', text: 'Creació Taula Hospital.' }
    expect(isGraphicalAnswer(q)).toBe(false)
  })

  it('retorna false per type text explícit', () => {
    const q: TemplateQuestion = { id: 'Q1', text: 'Creació Taula.', type: 'text' }
    expect(isGraphicalAnswer(q)).toBe(false)
  })

  it('retorna true per type diagram', () => {
    const q: TemplateQuestion = { id: 'Q1', text: 'Diagrama ERD.', type: 'diagram' }
    expect(isGraphicalAnswer(q)).toBe(true)
  })

  it('retorna true per tag graphical', () => {
    const q: TemplateQuestion = { id: 'Q1', text: 'Esquema UML.', tags: ['graphical'] }
    expect(isGraphicalAnswer(q)).toBe(true)
  })

  it('retorna true per type diagram i tags combinats', () => {
    const q: TemplateQuestion = {
      id: 'Q1',
      text: 'Esquema.',
      type: 'diagram',
      tags: ['graphical', 'erd'],
    }
    expect(isGraphicalAnswer(q)).toBe(true)
  })

  it('retorna false per tags sense graphical', () => {
    const q: TemplateQuestion = { id: 'Q1', text: 'Pregunta.', tags: ['sql', 'ddl'] }
    expect(isGraphicalAnswer(q)).toBe(false)
  })

  it('conservador: tags buit → false', () => {
    const q: TemplateQuestion = { id: 'Q1', text: 'Pregunta.', tags: [] }
    expect(isGraphicalAnswer(q)).toBe(false)
  })
})
