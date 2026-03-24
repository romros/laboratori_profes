import { describe, expect, it } from 'vitest'

import { buildEvaluateAnswerPrompt } from '../../../src/features/answer-evaluator/services/evaluateAnswerPrompt'

const minimalSpec = {
  question_id: 'Q1',
  question_text: 'Creació Taula Hospital amb restriccions.',
  max_score: 0.33,
  question_type: 'sql_ddl',
  expected_answer: 'CREATE TABLE Hospital (...);',
  what_to_evaluate: ['Clau primària', 'NOT NULL camps obligatoris'],
  required_elements: ['CREATE TABLE Hospital', 'PRIMARY KEY'],
  accepted_variants: ['PRIMARY KEY pot declarar-se a nivell de taula'],
  important_mistakes: ['No posar PRIMARY KEY'],
  teacher_style_notes: ['Prioritza semàntica sobre sintaxi exacta'],
  extraction_confidence: 0.99,
  inference_confidence: 0.9,
}

describe('buildEvaluateAnswerPrompt', () => {
  it('conté el bloc MODE PROFESSOR', () => {
    const prompt = buildEvaluateAnswerPrompt({
      questionSpec: minimalSpec,
      answerText: 'CREATE TABLE Hospital (id INT PRIMARY KEY);',
    })
    expect(prompt).toContain('MODE PROFESSOR')
  })

  it("objectiu MODE PROFESSOR: 'que el professor confiï en el judici'", () => {
    const prompt = buildEvaluateAnswerPrompt({
      questionSpec: minimalSpec,
      answerText: 'qualsevol',
    })
    expect(prompt).toMatch(/confï|confiï en el judici/i)
  })

  it('conté el bloc MODE AVALUACIÓ amb regles conceptuals', () => {
    const prompt = buildEvaluateAnswerPrompt({
      questionSpec: minimalSpec,
      answerText: 'qualsevol',
    })
    expect(prompt).toContain('MODE AVALUACIÓ')
    expect(prompt).toContain('accepted_variants')
    expect(prompt).toContain('required_elements')
  })

  it('conté el GUARDRAIL OCR per a textos ambigus', () => {
    const prompt = buildEvaluateAnswerPrompt({
      questionSpec: minimalSpec,
      answerText: 'qualsevol',
    })
    expect(prompt).toContain('GUARDRAIL OCR')
    expect(prompt).toMatch(/baix|baixa la confian/i)
  })

  it('inclou question_id, question_text i required_elements a la secció PREGUNTA', () => {
    const prompt = buildEvaluateAnswerPrompt({
      questionSpec: minimalSpec,
      answerText: 'CREATE TABLE Hospital (id INT PRIMARY KEY);',
    })
    expect(prompt).toContain('Q1')
    expect(prompt).toContain('Creació Taula Hospital amb restriccions.')
    expect(prompt).toContain('CREATE TABLE Hospital')
    expect(prompt).toContain('PRIMARY KEY')
  })

  it("inclou la resposta de l'alumne a la secció RESPOSTA DE L'ALUMNE", () => {
    const prompt = buildEvaluateAnswerPrompt({
      questionSpec: minimalSpec,
      answerText: 'CREATE TABLE Hospital (id INT PRIMARY KEY);',
    })
    expect(prompt).toContain("RESPOSTA DE L'ALUMNE")
    expect(prompt).toContain('CREATE TABLE Hospital (id INT PRIMARY KEY);')
  })

  it('inclou el bloc CONTEXT_DOCUMENT_PROFESSOR quan es passa', () => {
    const prompt = buildEvaluateAnswerPrompt({
      questionSpec: minimalSpec,
      answerText: 'qualsevol',
      examDocumentContext: 'Hospital(codi, cp, carrer)',
    })
    expect(prompt).toContain('CONTEXT_DOCUMENT_PROFESSOR')
    expect(prompt).toContain('Hospital(codi, cp, carrer)')
  })

  it('placeholder CONTEXT_DOCUMENT_PROFESSOR quan no es passa', () => {
    const prompt = buildEvaluateAnswerPrompt({
      questionSpec: minimalSpec,
      answerText: 'qualsevol',
    })
    expect(prompt).toContain('CONTEXT_DOCUMENT_PROFESSOR')
    expect(prompt).toContain("no s'ha facilitat context del document")
  })

  it('el format de sortida especifica els 3 camps JSON obligatoris', () => {
    const prompt = buildEvaluateAnswerPrompt({
      questionSpec: minimalSpec,
      answerText: 'qualsevol',
    })
    expect(prompt).toContain('"verdict"')
    expect(prompt).toContain('"feedback"')
    expect(prompt).toContain('"confidence"')
    expect(prompt).toContain('Respon NOMÉS amb un objecte JSON vàlid')
  })

  it('descriu els tres veredictes possibles al format', () => {
    const prompt = buildEvaluateAnswerPrompt({
      questionSpec: minimalSpec,
      answerText: 'qualsevol',
    })
    expect(prompt).toContain('"correct"')
    expect(prompt).toContain('"partial"')
    expect(prompt).toContain('"incorrect"')
  })
})
