import { describe, expect, it } from 'vitest'

import {
  assessmentSpecSchema,
  questionSpecSchema,
} from '../../../src/domain/assessment-spec/assessmentSpec.schema'

const validQuestion = {
  question_id: 'Q1',
  question_text: 'Defineix una taula SQL per a clients.',
  max_score: 2.5,
  question_type: 'sql_ddl',
  expected_answer: 'CREATE TABLE clients (id INT PRIMARY KEY, nom VARCHAR(100));',
  what_to_evaluate: ['sintaxi correcta', 'clau primària'],
  required_elements: ['PRIMARY KEY'],
  accepted_variants: ['CREATE TABLE IF NOT EXISTS clients ...'],
  important_mistakes: ['oblidar PRIMARY KEY', 'tipus de dades incorrectes'],
  teacher_style_notes: ['acceptar tant INT com INTEGER'],
  extraction_confidence: 0.95,
  inference_confidence: 0.8,
}

describe('questionSpecSchema', () => {
  it('valida un QuestionSpec correcte', () => {
    expect(() => questionSpecSchema.parse(validQuestion)).not.toThrow()
  })

  it('rebutja max_score no numèric', () => {
    expect(() => questionSpecSchema.parse({ ...validQuestion, max_score: 'dos' })).toThrow()
  })

  it('rebutja extraction_confidence > 1', () => {
    expect(() =>
      questionSpecSchema.parse({ ...validQuestion, extraction_confidence: 1.5 }),
    ).toThrow()
  })

  it('valida max_score null', () => {
    expect(() => questionSpecSchema.parse({ ...validQuestion, max_score: null })).not.toThrow()
  })

  it('valida arrays buits (what_to_evaluate: [])', () => {
    expect(() => questionSpecSchema.parse({ ...validQuestion, what_to_evaluate: [] })).not.toThrow()
  })
})

describe('assessmentSpecSchema', () => {
  it('valida un AssessmentSpec complet', () => {
    const spec = {
      exam_id: 'exam_1234567890',
      title: 'Examen SQL Trimestre 1',
      questions: [validQuestion],
    }
    expect(() => assessmentSpecSchema.parse(spec)).not.toThrow()
  })

  it('valida AssessmentSpec sense title (optional)', () => {
    const spec = {
      exam_id: 'exam_1234567890',
      questions: [],
    }
    expect(() => assessmentSpecSchema.parse(spec)).not.toThrow()
  })

  it('rebutja AssessmentSpec sense exam_id', () => {
    const spec = {
      questions: [validQuestion],
    }
    expect(() => assessmentSpecSchema.parse(spec)).toThrow()
  })
})
