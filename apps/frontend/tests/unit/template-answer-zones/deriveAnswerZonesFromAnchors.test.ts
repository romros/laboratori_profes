import { describe, it, expect } from 'vitest'

import { deriveAnswerZonesFromAnchors } from '../../../src/features/template-answer-zones/deriveAnswerZonesFromAnchors'
import type { DetectedQuestionAnchor } from '../../../src/features/template-anchor-detection/types'
import type { OcrPageLines } from '../../../src/features/template-answer-zones/types'

// ---------------------------------------------------------------------------
// Fixtures helpers
// ---------------------------------------------------------------------------

const questions = [
  { id: 'Q1', text: 'Creació Taula Hospital.' },
  { id: 'Q2', text: 'Creació Taula Pacient.' },
  { id: 'Q3', text: 'Creació Taula Habitacio.' },
]

function makeAnchor(qid: string, page: number, matchedText: string): DetectedQuestionAnchor {
  return { question_id: qid, page_index: page, matched_text: matchedText, similarity: 0.9 }
}

const pages: OcrPageLines[] = [
  {
    pageIndex: 1,
    lines: [
      'Nom alumne',
      '1. Creació Taula Hospital amb les restriccions.',
      'CREATE TABLE Hospital...',
      'PRIMARY KEY...',
      '2. Creació Taula Pacient amb les restriccions.',
      'CREATE TABLE Pacient...',
    ],
  },
  {
    pageIndex: 2,
    lines: [
      '3. Creació Taula Habitacio amb les restriccions.',
      'CREATE TABLE Habitacio...',
      'FOREIGN KEY...',
      'END;',
    ],
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('deriveAnswerZonesFromAnchors', () => {
  it('dues preguntes consecutives al mateix full', () => {
    const anchors = [
      makeAnchor('Q1', 1, '1. Creació Taula Hospital amb les restriccions.'),
      makeAnchor('Q2', 1, '2. Creació Taula Pacient amb les restriccions.'),
    ]
    const result = deriveAnswerZonesFromAnchors(questions.slice(0, 2), anchors, pages)

    const z1 = result.zones.find((z) => z.question_id === 'Q1')!
    const z2 = result.zones.find((z) => z.question_id === 'Q2')!

    // Q1 comença a la línia 2 (just després de l'anchor a línia 1)
    expect(z1.start_page_index).toBe(1)
    expect(z1.start_line_index).toBe(2)
    // Q1 acaba just abans de l'anchor de Q2 (línia 4)
    expect(z1.end_page_index).toBe(1)
    expect(z1.end_line_index).toBe(3)

    // Q2 comença a la línia 5
    expect(z2.start_page_index).toBe(1)
    expect(z2.start_line_index).toBe(5)
    // Q2 és l'última → s'estén fins al final del document
    expect(z2.end_page_index).toBe(2)
  })

  it('canvi de pàgina entre una resposta i la següent', () => {
    const anchors = [
      makeAnchor('Q2', 1, '2. Creació Taula Pacient amb les restriccions.'),
      makeAnchor('Q3', 2, '3. Creació Taula Habitacio amb les restriccions.'),
    ]
    const result = deriveAnswerZonesFromAnchors(questions.slice(1), anchors, pages)

    const z2 = result.zones.find((z) => z.question_id === 'Q2')!
    const z3 = result.zones.find((z) => z.question_id === 'Q3')!

    // Q2 ha d'arribar fins a la pàgina 1 (última línia abans de Q3 a p2)
    expect(z2.end_page_index).toBe(1)
    // Q3 comença a pàgina 2
    expect(z3.start_page_index).toBe(2)
    expect(z3.end_page_index).toBe(2)
  })

  it('anchor absent — pregunta va a not_detected', () => {
    const anchors = [
      makeAnchor('Q1', 1, '1. Creació Taula Hospital amb les restriccions.'),
      // Q2 absent
      makeAnchor('Q3', 2, '3. Creació Taula Habitacio amb les restriccions.'),
    ]
    const result = deriveAnswerZonesFromAnchors(questions, anchors, pages)

    expect(result.not_detected).toContain('Q2')
    // Però Q1 i Q3 sí que es deriven
    expect(result.zones.map((z) => z.question_id)).toContain('Q1')
    expect(result.zones.map((z) => z.question_id)).toContain('Q3')
  })

  it("última pregunta s'estén fins al final del document", () => {
    const anchors = [makeAnchor('Q3', 2, '3. Creació Taula Habitacio amb les restriccions.')]
    const result = deriveAnswerZonesFromAnchors([questions[2]!], anchors, pages)

    const z = result.zones[0]!
    expect(z.end_page_index).toBe(2)
    expect(z.end_line_index).toBe(3) // última línia de pàgina 2
  })

  it('cap anchor → cap zona, totes a not_detected', () => {
    const result = deriveAnswerZonesFromAnchors(questions, [], pages)
    expect(result.zones).toHaveLength(0)
    expect(result.not_detected).toHaveLength(questions.length)
  })

  it('anchor_similarity es propaga al rang', () => {
    const anchor = { ...makeAnchor('Q1', 1, '1. Creació Taula Hospital.'), similarity: 0.75 }
    const result = deriveAnswerZonesFromAnchors([questions[0]!], [anchor], pages)
    expect(result.zones[0]?.anchor_similarity).toBe(0.75)
  })
})
