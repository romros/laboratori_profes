import { describe, expect, it } from 'vitest'

import {
  computeNoiseRatio,
  hasSqlSignal,
  routeQuestionForEvaluation,
} from '../../../src/features/answer-evaluator/services/routeQuestionForEvaluation'

// ── computeNoiseRatio ──────────────────────────────────────────────────────────

describe('computeNoiseRatio', () => {
  it('text buit → 1', () => {
    expect(computeNoiseRatio('')).toBe(1)
  })

  it('text SQL net → rati baix', () => {
    const ratio = computeNoiseRatio('CREATE TABLE Hospital (codi INT PRIMARY KEY);')
    expect(ratio).toBeLessThan(0.1)
  })

  it('text totalment corrupte → rati alt', () => {
    // Caràcters estranys sense alfanumèrics
    const ratio = computeNoiseRatio('§§§§§§§§§§')
    expect(ratio).toBeGreaterThan(0.9)
  })

  it('text mixt → rati intermedi', () => {
    const ratio = computeNoiseRatio('CREATE§§TABLE')
    expect(ratio).toBeGreaterThan(0)
    expect(ratio).toBeLessThan(1)
  })
})

// ── hasSqlSignal ───────────────────────────────────────────────────────────────

describe('hasSqlSignal', () => {
  it('CREATE TABLE → true', () => {
    expect(hasSqlSignal('CREATE TABLE Hospital')).toBe(true)
  })

  it('INSERT INTO → true', () => {
    expect(hasSqlSignal('INSERT INTO Pacient VALUES')).toBe(true)
  })

  it('PRIMARY KEY → true (via \\bprimary\\b)', () => {
    expect(hasSqlSignal('codi INT PRIMARY KEY')).toBe(true)
  })

  it('text sense SQL → false', () => {
    expect(hasSqlSignal('No tinc ni idea de SQL')).toBe(false)
  })

  it('paraules SQL parcialment incrustades (sense word boundary) → false per als exactes', () => {
    // "intable" no hauria de disparar \btable\b
    expect(hasSqlSignal('intable')).toBe(false)
  })

  it('case-insensitive: "create table" minúscules → true', () => {
    expect(hasSqlSignal('create table hospital')).toBe(true)
  })
})

// ── routeQuestionForEvaluation ─────────────────────────────────────────────────

describe('routeQuestionForEvaluation', () => {
  // ── Regla 1: skip per status empty / not_detected ──────────────────────────

  it("status 'empty' → skip", () => {
    const result = routeQuestionForEvaluation({
      question_id: 'Q4',
      answer_text: '',
      ocr_status: 'empty',
    })
    expect(result.route).toBe('skip')
    expect(result.reason).toMatch(/empty/)
  })

  it("status 'not_detected' → skip", () => {
    const result = routeQuestionForEvaluation({
      question_id: 'Q0',
      answer_text: '',
      ocr_status: 'not_detected',
    })
    expect(result.route).toBe('skip')
    expect(result.reason).toMatch(/not_detected/)
  })

  // ── Regla 2: text massa curt ───────────────────────────────────────────────

  it('ok + text massa curt (< 15 chars) → skip', () => {
    const result = routeQuestionForEvaluation({
      question_id: 'Q1',
      answer_text: 'ok',
      ocr_status: 'ok',
    })
    expect(result.route).toBe('skip')
    expect(result.reason).toMatch(/curt/)
  })

  it('ok + text curt + hasImageCrop → vision', () => {
    const result = routeQuestionForEvaluation(
      { question_id: 'Q1', answer_text: 'ok', ocr_status: 'ok' },
      true,
    )
    expect(result.route).toBe('vision')
  })

  // ── Regla 3: soroll alt sense senyal SQL ───────────────────────────────────

  it('ok + text llarg corrupte (> 60% soroll) + sense SQL → skip', () => {
    // 20 caràcters estranys (§) + 5 alfanumèrics → 80% soroll
    const corruptText = 'abcde§§§§§§§§§§§§§§§§'
    const result = routeQuestionForEvaluation({
      question_id: 'Q1',
      answer_text: corruptText,
      ocr_status: 'ok',
    })
    expect(result.route).toBe('skip')
  })

  it('ok + text llarg corrupte + amb senyal SQL → text (inferència possible)', () => {
    // Barreja de corrupció + CREATE TABLE (senyal SQL reconeixible)
    const corruptWithSql = 'CREATE§§§§§§§§§§§§TABLE§§§§§§§§§§§§'
    const result = routeQuestionForEvaluation({
      question_id: 'Q1',
      answer_text: corruptWithSql,
      ocr_status: 'ok',
    })
    expect(result.route).toBe('text')
  })

  // ── Regla 4: ok net → text ─────────────────────────────────────────────────

  it('ok + text SQL net → text', () => {
    const result = routeQuestionForEvaluation({
      question_id: 'Q1',
      answer_text: 'CREATE TABLE Hospital (codi INT PRIMARY KEY, cp CHAR(5) NOT NULL);',
      ocr_status: 'ok',
    })
    expect(result.route).toBe('text')
    expect(result.question_id).toBe('Q1')
  })

  // ── Regla 5: uncertain + senyal SQL → text ─────────────────────────────────

  it('uncertain + senyal SQL reconeixible → text', () => {
    const result = routeQuestionForEvaluation({
      question_id: 'Q5',
      answer_text: 'CREAT TABL Tractament (idTractament INT PRIMAR KEY)',
      ocr_status: 'uncertain',
    })
    expect(result.route).toBe('text')
    expect(result.reason).toMatch(/SQL/)
  })

  // ── Regla 6: uncertain sense SQL → skip ───────────────────────────────────

  it('uncertain + sense senyal SQL → skip', () => {
    const result = routeQuestionForEvaluation({
      question_id: 'Q5',
      answer_text: 'text incomprensible sense paraules clau de SQL',
      ocr_status: 'uncertain',
    })
    expect(result.route).toBe('skip')
  })

  it('uncertain + sense SQL + hasImageCrop → vision', () => {
    const result = routeQuestionForEvaluation(
      {
        question_id: 'Q5',
        answer_text: 'text incomprensible sense paraules clau de SQL',
        ocr_status: 'uncertain',
      },
      true,
    )
    expect(result.route).toBe('vision')
  })

  // ── Estructura de retorn ───────────────────────────────────────────────────

  it('sempre retorna question_id, route i reason', () => {
    const result = routeQuestionForEvaluation({
      question_id: 'Q3',
      answer_text: 'CREATE TABLE Habitacio (numHabitacio INT PRIMARY KEY);',
      ocr_status: 'ok',
    })
    expect(result.question_id).toBe('Q3')
    expect(['text', 'vision', 'skip']).toContain(result.route)
    expect(typeof result.reason).toBe('string')
    expect(result.reason.length).toBeGreaterThan(0)
  })
})
