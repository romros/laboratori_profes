import { describe, it, expect } from 'vitest'

import { detectTemplateQuestionAnchors } from '../../../src/features/template-anchor-detection/detectTemplateQuestionAnchors'
import {
  normalizeText,
  keywordsOf,
} from '../../../src/features/template-anchor-detection/normalizeText'
import { scoreKeywordOverlap } from '../../../src/features/template-anchor-detection/scoreSimilarity'

// ---------------------------------------------------------------------------
// normalizeText
// ---------------------------------------------------------------------------

describe('normalizeText', () => {
  it('converteix a minúscules', () => {
    expect(normalizeText('Creació')).toBe('creacio')
  })

  it('elimina accents', () => {
    expect(normalizeText('Habitació')).toBe('habitacio')
    expect(normalizeText('Inserir')).toBe('inserir')
  })

  it('elimina puntuació bàsica', () => {
    expect(normalizeText('Creació (1,5 punts).')).toBe('creacio 1 5 punts')
  })

  it('col·lapsa espais', () => {
    expect(normalizeText('  hola   món  ')).toBe('hola mon')
  })

  it('text buit retorna buit', () => {
    expect(normalizeText('')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// keywordsOf
// ---------------------------------------------------------------------------

describe('keywordsOf', () => {
  it('filtra paraules curtes (<4 chars)', () => {
    expect(keywordsOf('creacio de la taula biblioteca')).toEqual(['creacio', 'taula', 'biblioteca'])
  })

  it('retorna totes les paraules llargues', () => {
    expect(keywordsOf('inserir prestec hospital')).toEqual(['inserir', 'prestec', 'hospital'])
  })
})

// ---------------------------------------------------------------------------
// scoreKeywordOverlap
// ---------------------------------------------------------------------------

describe('scoreKeywordOverlap', () => {
  it('match perfecte retorna 1', () => {
    const norm = 'creacio taula biblioteca restriccions'
    expect(scoreKeywordOverlap(norm, norm)).toBe(1)
  })

  it('match parcial retorna fracció correcta', () => {
    // 2 de 3 keywords (biblioteca i restriccions presents, prestec no)
    const template = 'creacio taula biblioteca restriccions'
    const line = 'creacio taula restriccions amb soroll ocr'
    // keywords: creacio(4), taula(5), biblioteca(10), restriccions(12) → 4 keywords
    // hits: creacio ✓, taula ✓, biblioteca ✗, restriccions ✓ → 3/4 = 0.75
    const score = scoreKeywordOverlap(template, line)
    expect(score).toBeCloseTo(0.75)
  })

  it('cap match retorna 0', () => {
    expect(scoreKeywordOverlap('creacio taula', 'xxxxxxxx yyyy')).toBe(0)
  })

  it('template buit retorna 0', () => {
    expect(scoreKeywordOverlap('', 'creacio taula')).toBe(0)
  })

  it('tolerant a soroll OCR al voltant de les paraules clau', () => {
    const template = 'creacio taula biblioteca'
    const lineWithNoise = 'XXX 1 creacio AAAA taula RRR biblioteca YY'
    expect(scoreKeywordOverlap(template, lineWithNoise)).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// detectTemplateQuestionAnchors
// ---------------------------------------------------------------------------

describe('detectTemplateQuestionAnchors', () => {
  const pages = [
    {
      pageIndex: 1,
      text: [
        'Nom: Joan Garcia',
        '1. Creació de la taula Biblioteca amb les restriccions. (1,5 punts)',
        'resposta de l alumne aqui...',
        '2. Inserir registres a la taula Prestec del sistema. (1 punt)',
        'altra resposta',
      ].join('\n'),
    },
    {
      pageIndex: 2,
      text: [
        '3. Modificar el camp cognom de la taula Autor. (0,5 punts)',
        'resposta pagina 2',
      ].join('\n'),
    },
  ]

  const questions = [
    { id: 'Q1', text: 'Creació de la taula Biblioteca amb les restriccions corresponents.' },
    { id: 'Q2', text: 'Inserir registres a la taula Préstec.' },
    { id: 'Q3', text: 'Modificar el camp cognom de la taula Autor.' },
    { id: 'Q_ABSENT', text: 'Eliminar tots els registres de la taula Xarxa.' },
  ]

  it('detecta preguntes presents i retorna pàgina correcta', () => {
    const result = detectTemplateQuestionAnchors(questions, pages)
    const ids = result.detected.map((d) => d.question_id)
    expect(ids).toContain('Q1')
    expect(ids).toContain('Q2')
    expect(ids).toContain('Q3')
  })

  it('Q3 es detecta a la pàgina 2', () => {
    const result = detectTemplateQuestionAnchors(questions, pages)
    const q3 = result.detected.find((d) => d.question_id === 'Q3')
    expect(q3?.page_index).toBe(2)
  })

  it('pregunta absent va a not_found', () => {
    const result = detectTemplateQuestionAnchors(questions, pages)
    expect(result.not_found).toContain('Q_ABSENT')
  })

  it('similarity entre 0 i 1', () => {
    const result = detectTemplateQuestionAnchors(questions, pages)
    for (const d of result.detected) {
      expect(d.similarity).toBeGreaterThanOrEqual(0)
      expect(d.similarity).toBeLessThanOrEqual(1)
    }
  })

  it('matched_text no és buit', () => {
    const result = detectTemplateQuestionAnchors(questions, pages)
    for (const d of result.detected) {
      expect(d.matched_text.length).toBeGreaterThan(0)
    }
  })

  it('pages buides → tot not_found', () => {
    const result = detectTemplateQuestionAnchors(questions, [])
    expect(result.detected).toHaveLength(0)
    expect(result.not_found).toHaveLength(questions.length)
  })

  it('template buit → resultat buit', () => {
    const result = detectTemplateQuestionAnchors([], pages)
    expect(result.detected).toHaveLength(0)
    expect(result.not_found).toHaveLength(0)
  })
})
