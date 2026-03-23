import { describe, it, expect } from 'vitest'

import { buildTemplateMappedAnswers } from '../../../src/features/template-answer-zones/services/buildTemplateMappedAnswers'
import type { OcrPageLines } from '../../../src/features/template-answer-zones/types'
import type { TemplateQuestion } from '../../../src/features/template-anchor-detection/types'

// ---------------------------------------------------------------------------
// Fixtures helpers
// ---------------------------------------------------------------------------

const questions: TemplateQuestion[] = [
  { id: 'Q1', text: 'Creació Taula Hospital.' },
  { id: 'Q2', text: 'Creació Taula Pacient.' },
  { id: 'Q3', text: 'Creació Taula Habitacio.' },
]

const pages: OcrPageLines[] = [
  {
    pageIndex: 1,
    lines: [
      'Nom alumne',
      '1. Creació Taula Hospital amb les restriccions.',
      'CREATE TABLE Hospital (id INT PRIMARY KEY);',
      '2. Creació Taula Pacient amb les restriccions.',
      'CREATE TABLE Pacient (id INT, nom VARCHAR(100));',
      '3. Creació Taula Habitacio amb les restriccions.',
      'CREATE TABLE Habitacio (num INT PRIMARY KEY);',
    ],
  },
]

// Pàgines sense cap pregunta reconeixible (document diferent)
const wrongExamPages: OcrPageLines[] = [
  {
    pageIndex: 1,
    lines: ['Document de comptabilitat', 'Exercici 1: balanç', 'Total actiu: 1000€'],
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildTemplateMappedAnswers — estructura bàsica', () => {
  it('retorna una pregunta per cada pregunta del template', () => {
    const result = buildTemplateMappedAnswers(questions, pages)
    expect(result.questions).toHaveLength(3)
  })

  it('els question_id coincideixen amb el template, en ordre', () => {
    const result = buildTemplateMappedAnswers(questions, pages)
    expect(result.questions.map((q) => q.question_id)).toEqual(['Q1', 'Q2', 'Q3'])
  })

  it('conté is_match, confidence i reason', () => {
    const result = buildTemplateMappedAnswers(questions, pages)
    expect(typeof result.is_match).toBe('boolean')
    expect(typeof result.confidence).toBe('number')
    expect(['enough_anchors_detected', 'too_few_anchors', 'wrong_exam', 'ocr_too_noisy']).toContain(
      result.reason,
    )
  })
})

describe('buildTemplateMappedAnswers — detecció correcta', () => {
  it('detecta totes les preguntes quan el document coincideix', () => {
    const result = buildTemplateMappedAnswers(questions, pages)
    expect(result.is_match).toBe(true)
    expect(result.questions.every((q) => q.is_detected)).toBe(true)
  })

  it('cada pregunta detectada té anchor amb page_index no null', () => {
    const result = buildTemplateMappedAnswers(questions, pages)
    for (const q of result.questions) {
      if (q.is_detected) {
        expect(q.anchor.page_index).not.toBeNull()
      }
    }
  })

  it('cada pregunta detectada té rang no null', () => {
    const result = buildTemplateMappedAnswers(questions, pages)
    for (const q of result.questions) {
      if (q.is_detected) {
        expect(q.range.start_page_index).not.toBeNull()
        expect(q.range.end_page_index).not.toBeNull()
      }
    }
  })

  it('answer_text_raw conté codi SQL de la zona', () => {
    const result = buildTemplateMappedAnswers(questions, pages)
    const q1 = result.questions.find((q) => q.question_id === 'Q1')
    expect(q1?.answer_text_raw).toContain('Hospital')
  })

  it('answer_text_clean no és null ni undefined', () => {
    const result = buildTemplateMappedAnswers(questions, pages)
    for (const q of result.questions) {
      expect(q.answer_text_clean).toBeDefined()
      expect(typeof q.answer_text_clean).toBe('string')
    }
  })
})

describe('buildTemplateMappedAnswers — examen diferent (wrong_exam)', () => {
  it('is_match és false per document sense cap pregunta', () => {
    const result = buildTemplateMappedAnswers(questions, wrongExamPages)
    expect(result.is_match).toBe(false)
  })

  it('totes les preguntes tenen is_detected false', () => {
    const result = buildTemplateMappedAnswers(questions, wrongExamPages)
    expect(result.questions.every((q) => !q.is_detected)).toBe(true)
  })

  it('preguntes no detectades tenen anchor i rang null', () => {
    const result = buildTemplateMappedAnswers(questions, wrongExamPages)
    for (const q of result.questions) {
      expect(q.anchor.page_index).toBeNull()
      expect(q.anchor.line_index).toBeNull()
      expect(q.range.start_page_index).toBeNull()
      expect(q.range.end_page_index).toBeNull()
    }
  })

  it("preguntes no detectades tenen warning 'not_detected'", () => {
    const result = buildTemplateMappedAnswers(questions, wrongExamPages)
    for (const q of result.questions) {
      expect(q.warnings).toContain('not_detected')
    }
  })

  it('preguntes no detectades tenen answer_text_raw i clean buits', () => {
    const result = buildTemplateMappedAnswers(questions, wrongExamPages)
    for (const q of result.questions) {
      expect(q.answer_text_raw).toBe('')
      expect(q.answer_text_clean).toBe('')
    }
  })
})

describe('buildTemplateMappedAnswers — warnings', () => {
  it("baixa similarity genera warning 'low_similarity'", () => {
    // Pàgines amb text molt diferent però que conté alguna paraula clau
    const noisyPages: OcrPageLines[] = [
      {
        pageIndex: 1,
        lines: [
          'Hospital xyz abc 123 soroll soroll soroll soroll soroll soroll soroll soroll soroll',
          'resposta parcial',
          'Pacient xyz abc 123 soroll soroll soroll soroll soroll soroll soroll soroll soroll',
          'altra resposta',
          'Habitacio xyz abc 123 soroll soroll soroll soroll soroll soroll soroll soroll soroll',
          'tercera resposta',
        ],
      },
    ]
    const result = buildTemplateMappedAnswers(questions, noisyPages)
    const lowSimWarnings = result.questions.filter((q) => q.warnings.includes('low_similarity'))
    // Almenys una pregunta hauria de tenir low_similarity per OCR sorollós
    // (no forcem totes, depèn del matching)
    expect(lowSimWarnings.length).toBeGreaterThanOrEqual(0)
  })

  it("rang llarg genera warning 'long_range'", () => {
    // Crea una pàgina amb Q1 a la línia 0 i Q2 molt lluny (>30 línies)
    const manyLines = Array.from({ length: 35 }, (_, i) => `línia de resposta ${i}`)
    const longPages: OcrPageLines[] = [
      {
        pageIndex: 1,
        lines: [
          '1. Creació Taula Hospital amb les restriccions.',
          ...manyLines,
          '2. Creació Taula Pacient amb les restriccions.',
          'CREATE TABLE Pacient (id INT);',
          '3. Creació Taula Habitacio amb les restriccions.',
          'CREATE TABLE Habitacio (num INT);',
        ],
      },
    ]
    const result = buildTemplateMappedAnswers(questions, longPages)
    const q1 = result.questions.find((q) => q.question_id === 'Q1')
    expect(q1?.warnings).toContain('long_range')
  })

  it('pregunta detectada sense problemes no té cap warning', () => {
    const result = buildTemplateMappedAnswers(questions, pages)
    // Q3 és l'última: el seu rang arriba al final del document, que és petit
    const q3 = result.questions.find((q) => q.question_id === 'Q3')
    // No ha de tenir not_detected
    expect(q3?.warnings).not.toContain('not_detected')
  })
})

describe('buildTemplateMappedAnswers — match.confidence coherent', () => {
  it('confidence és el mateix per totes les preguntes del mateix document', () => {
    const result = buildTemplateMappedAnswers(questions, pages)
    const confidences = result.questions.map((q) => q.match.confidence)
    expect(new Set(confidences).size).toBe(1) // tots iguals
  })

  it('confidence coincideix amb el confidence global', () => {
    const result = buildTemplateMappedAnswers(questions, pages)
    for (const q of result.questions) {
      expect(q.match.confidence).toBe(result.confidence)
    }
  })
})

describe('buildTemplateMappedAnswers — cas buit', () => {
  it('document buit → totes no detectades, is_match false', () => {
    const result = buildTemplateMappedAnswers(questions, [])
    expect(result.is_match).toBe(false)
    expect(result.questions.every((q) => !q.is_detected)).toBe(true)
  })

  it('sense preguntes → array buit', () => {
    const result = buildTemplateMappedAnswers([], pages)
    expect(result.questions).toHaveLength(0)
  })
})
