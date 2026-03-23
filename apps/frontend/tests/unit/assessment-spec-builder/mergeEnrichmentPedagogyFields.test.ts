import { describe, expect, it } from 'vitest'

import type { AssessmentSpec } from '../../../src/domain/assessment-spec/assessmentSpec.schema'
import {
  type EnrichmentPedagogyQuestion,
  mergeEnrichmentPedagogyFields,
} from '../../../src/features/assessment-spec-builder/services/enrichAssessmentSpec'

function q(
  id: string,
  overrides: Partial<AssessmentSpec['questions'][number]> = {},
): AssessmentSpec['questions'][number] {
  return {
    question_id: id,
    question_text: `text ${id}`,
    max_score: 1,
    question_type: 't',
    expected_answer: `ans ${id}`,
    what_to_evaluate: ['old'],
    required_elements: [],
    accepted_variants: [],
    important_mistakes: [],
    teacher_style_notes: [],
    extraction_confidence: 1,
    inference_confidence: 0.5,
    ...overrides,
  }
}

describe('mergeEnrichmentPedagogyFields', () => {
  it('manté camps no pedagògics del base i aplica els quatre camps del model', () => {
    const base: AssessmentSpec = {
      exam_id: 'e1',
      title: 'T',
      questions: [
        q('Q1', {
          question_text: 'original',
          expected_answer: 'sol',
          max_score: 0.33,
          question_type: 'sql_ddl',
        }),
      ],
    }
    const enrichedQs: EnrichmentPedagogyQuestion[] = [
      {
        question_id: 'Q1',
        what_to_evaluate: ['nou 1', 'nou 2'],
        required_elements: ['req'],
        important_mistakes: ['err'],
        teacher_style_notes: ['nota'],
      },
    ]

    const out = mergeEnrichmentPedagogyFields(base, enrichedQs)
    expect(out.exam_id).toBe('e1')
    expect(out.title).toBe('T')
    expect(out.questions[0].question_text).toBe('original')
    expect(out.questions[0].expected_answer).toBe('sol')
    expect(out.questions[0].max_score).toBe(0.33)
    expect(out.questions[0].question_type).toBe('sql_ddl')
    expect(out.questions[0].accepted_variants).toEqual([])
    expect(out.questions[0].extraction_confidence).toBe(1)
    expect(out.questions[0].inference_confidence).toBe(0.5)
    expect(out.questions[0].what_to_evaluate).toEqual(['nou 1', 'nou 2'])
    expect(out.questions[0].required_elements).toEqual(['req'])
    expect(out.questions[0].important_mistakes).toEqual(['err'])
    expect(out.questions[0].teacher_style_notes).toEqual(['nota'])
  })

  it('rebutja si el model no retorna tots els question_id', () => {
    const base: AssessmentSpec = {
      exam_id: 'e',
      questions: [q('Q1'), q('Q2')],
    }
    const bad: EnrichmentPedagogyQuestion[] = [
      {
        question_id: 'Q1',
        what_to_evaluate: ['a'],
        required_elements: [],
        important_mistakes: [],
        teacher_style_notes: [],
      },
      {
        question_id: 'Q99',
        what_to_evaluate: ['b'],
        required_elements: [],
        important_mistakes: [],
        teacher_style_notes: [],
      },
    ]
    expect(() => mergeEnrichmentPedagogyFields(base, bad)).toThrow(/falta question_id/)
  })
})
