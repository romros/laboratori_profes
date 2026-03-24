import { describe, expect, it } from 'vitest'

import { gradeExam } from '../../../src/features/answer-evaluator/services/gradeExam'
import type { AssessmentSpec } from '../../../src/domain/assessment-spec/assessmentSpec.schema'
import { hospitalDawExamDocumentContext } from '../../fixtures/assessment-spec-builder/hospitalDawGolden'

// Spec mínima basada en Q1 hospital
const hospitalSpecQ1Q2: AssessmentSpec = {
  exam_id: 'hospital-test',
  title: 'Hospital DAW — test',
  questions: [
    {
      question_id: 'Q1',
      question_text: 'Creació Taula Hospital amb restriccions.',
      max_score: 0.33,
      question_type: 'sql_ddl',
      expected_answer: 'CREATE TABLE Hospital (codi INT PRIMARY KEY, cp CHAR(5) NOT NULL, ...);',
      what_to_evaluate: ['Clau primària', 'NOT NULL camps obligatoris', 'CHECK numero > 0'],
      required_elements: ['CREATE TABLE Hospital', 'PRIMARY KEY', 'NOT NULL', 'CHECK'],
      accepted_variants: ['PRIMARY KEY a nivell de taula'],
      important_mistakes: ['Sense PRIMARY KEY', 'numero sense CHECK positiu'],
      teacher_style_notes: ['Semàntica sobre sintaxi'],
      extraction_confidence: 0.99,
      inference_confidence: 0.9,
    },
    {
      question_id: 'Q2',
      question_text: 'Creació Taula Pacient.',
      max_score: 0.33,
      question_type: 'sql_ddl',
      expected_answer: 'CREATE TABLE Pacient (nif CHAR(9) PRIMARY KEY, ...);',
      what_to_evaluate: ['nif com a PK', 'ON DELETE SET NULL'],
      required_elements: ['CREATE TABLE Pacient', 'nif CHAR(9) PRIMARY KEY'],
      accepted_variants: ['FK a nivell de taula'],
      important_mistakes: ['ON DELETE CASCADE en lloc de SET NULL'],
      teacher_style_notes: ['Coherència nul·labilitat i acció referencial'],
      extraction_confidence: 0.99,
      inference_confidence: 0.88,
    },
  ],
}

/** Crea un fetchImpl mock que retorna un veredicte LLM donat. */
function makeFetchMock(verdict: 'correct' | 'partial' | 'incorrect', confidence: number = 0.85) {
  return async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                verdict,
                feedback: `Feedback mock per a ${verdict}.`,
                confidence,
              }),
            },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
}

describe('gradeExam', () => {
  it("Cas OCR dolent ('empty') → evaluable_by_ocr 'no', verdict null, sense LLM call", async () => {
    // fetchImpl que llança error si es crida (garantia que el LLM no s'invoca)
    const fetchImpl = async () => {
      throw new Error('LLM no hauria de ser cridat per status empty')
    }

    const result = await gradeExam({
      student_id: 'alumne-001',
      assessment_spec: hospitalSpecQ1Q2,
      answers: [{ question_id: 'Q1', answer_text: '', ocr_status: 'empty' }],
      apiKey: 'test-key',
      fetchImpl,
    })

    expect(result.student_id).toBe('alumne-001')
    expect(result.question_results).toHaveLength(1)
    const q1 = result.question_results[0]
    expect(q1.question_id).toBe('Q1')
    expect(q1.evaluable_by_ocr).toBe('no')
    expect(q1.verdict).toBeNull()
    expect(q1.feedback).toBeNull()
    expect(q1.confidence).toBeNull()
  })

  it("Cas OCR 'not_detected' → evaluable_by_ocr 'no', sense LLM call", async () => {
    const fetchImpl = async () => {
      throw new Error('LLM no hauria de ser cridat per not_detected')
    }

    const result = await gradeExam({
      student_id: 'alumne-002',
      assessment_spec: hospitalSpecQ1Q2,
      answers: [{ question_id: 'Q2', answer_text: '', ocr_status: 'not_detected' }],
      apiKey: 'test-key',
      fetchImpl,
    })

    const q2 = result.question_results[0]
    expect(q2.evaluable_by_ocr).toBe('no')
    expect(q2.verdict).toBeNull()
  })

  it("Cas 'ok' amb resposta correcta → verdict 'correct' via LLM mock", async () => {
    const result = await gradeExam({
      student_id: 'alumne-003',
      assessment_spec: hospitalSpecQ1Q2,
      answers: [
        {
          question_id: 'Q1',
          answer_text:
            'CREATE TABLE Hospital (codi INT PRIMARY KEY, cp CHAR(5) NOT NULL, carrer VARCHAR(120) NOT NULL, numero INT NOT NULL CHECK (numero > 0));',
          ocr_status: 'ok',
        },
      ],
      apiKey: 'test-key',
      fetchImpl: makeFetchMock('correct', 0.92),
    })

    const q1 = result.question_results[0]
    expect(q1.evaluable_by_ocr).toBe('yes')
    expect(q1.verdict).toBe('correct')
    expect(q1.confidence).toBeCloseTo(0.92)
    expect(q1.feedback).toBeTruthy()
  })

  it("Cas 'ok' amb resposta parcial → verdict 'partial' via LLM mock", async () => {
    const result = await gradeExam({
      student_id: 'alumne-004',
      assessment_spec: hospitalSpecQ1Q2,
      answers: [
        {
          question_id: 'Q1',
          answer_text: 'CREATE TABLE Hospital (codi INT PRIMARY KEY, cp VARCHAR(10));',
          ocr_status: 'ok',
        },
      ],
      apiKey: 'test-key',
      fetchImpl: makeFetchMock('partial', 0.75),
    })

    const q1 = result.question_results[0]
    expect(q1.verdict).toBe('partial')
    expect(q1.confidence).toBeCloseTo(0.75)
  })

  it("Cas 'ok' amb resposta incorrecta → verdict 'incorrect' via LLM mock", async () => {
    const result = await gradeExam({
      student_id: 'alumne-005',
      assessment_spec: hospitalSpecQ1Q2,
      answers: [
        {
          question_id: 'Q1',
          answer_text: 'SELECT * FROM Hospital;',
          ocr_status: 'ok',
        },
      ],
      apiKey: 'test-key',
      fetchImpl: makeFetchMock('incorrect', 0.9),
    })

    const q1 = result.question_results[0]
    expect(q1.verdict).toBe('incorrect')
  })

  it("Cas 'uncertain' → evaluable_by_ocr 'review', el LLM s'invoca igualment", async () => {
    const result = await gradeExam({
      student_id: 'alumne-006',
      assessment_spec: hospitalSpecQ1Q2,
      answers: [
        {
          question_id: 'Q2',
          answer_text: 'CREATE TABLE Pacient (nif CHAR(9) PRIMARY KEY, nom VARCHAR(100) NOT NULL);',
          ocr_status: 'uncertain',
        },
      ],
      apiKey: 'test-key',
      fetchImpl: makeFetchMock('partial', 0.45),
    })

    const q2 = result.question_results[0]
    expect(q2.evaluable_by_ocr).toBe('review')
    expect(q2.verdict).toBe('partial') // LLM s'ha cridat
    expect(q2.confidence).toBeCloseTo(0.45)
  })

  it("múltiples respostes: barreja 'ok', 'empty', 'uncertain'", async () => {
    let llmCallCount = 0
    const fetchImpl = async () => {
      llmCallCount++
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({ verdict: 'correct', feedback: 'OK', confidence: 0.8 }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const result = await gradeExam({
      student_id: 'alumne-007',
      assessment_spec: hospitalSpecQ1Q2,
      answers: [
        { question_id: 'Q1', answer_text: 'CREATE TABLE Hospital (...);', ocr_status: 'ok' },
        { question_id: 'Q2', answer_text: '', ocr_status: 'empty' },
      ],
      apiKey: 'test-key',
      fetchImpl,
    })

    expect(result.question_results).toHaveLength(2)
    // Només Q1 (ok) hauria d'invocar el LLM
    expect(llmCallCount).toBe(1)
    expect(result.question_results[1].verdict).toBeNull() // Q2 empty
  })

  it('passa examDocumentContext al LLM (el prompt el conté)', async () => {
    let capturedBody = ''
    const fetchImpl = async (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = typeof init?.body === 'string' ? init.body : ''
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({ verdict: 'correct', feedback: 'Bé', confidence: 0.9 }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    await gradeExam({
      student_id: 'alumne-008',
      assessment_spec: hospitalSpecQ1Q2,
      answers: [
        {
          question_id: 'Q1',
          answer_text: 'CREATE TABLE Hospital (codi INT PRIMARY KEY);',
          ocr_status: 'ok',
        },
      ],
      exam_document_context: hospitalDawExamDocumentContext,
      apiKey: 'test-key',
      fetchImpl,
    })

    expect(capturedBody).toContain('CONTEXT_DOCUMENT_PROFESSOR')
    expect(capturedBody).toContain('Hospital(codi')
  })

  it("pregunta no trobada a l'AssessmentSpec → evaluable_by_ocr 'no' amb raó clara", async () => {
    const result = await gradeExam({
      student_id: 'alumne-009',
      assessment_spec: hospitalSpecQ1Q2,
      answers: [{ question_id: 'Q99', answer_text: 'qualsevol', ocr_status: 'ok' }],
      apiKey: 'test-key',
      fetchImpl: makeFetchMock('correct'),
    })

    const q99 = result.question_results[0]
    expect(q99.evaluable_by_ocr).toBe('no')
    expect(q99.evaluability_reason).toMatch(/Q99/)
    expect(q99.verdict).toBeNull()
  })
})
