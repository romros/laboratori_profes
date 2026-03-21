import { describe, expect, it } from 'vitest'

import { goBasicExam } from '../../../fixtures/template-inference/go-basic'
import {
  examFeasibilityDraftSchema,
  exerciseFeasibilityItemSchema,
  feasibilityDecisionSchema,
  parseFeasibilityDecision,
} from '../../../src/domain/template-inference/exam_feasibility.schema'

describe('examFeasibilityDraftSchema', () => {
  it('accepta draft GO basic (fixture)', () => {
    const r = examFeasibilityDraftSchema.safeParse(goBasicExam)
    expect(r.success).toBe(true)
  })

  it('rebutja exercises buits', () => {
    const r = examFeasibilityDraftSchema.safeParse({
      ...goBasicExam,
      exercises: [],
    })
    expect(r.success).toBe(false)
  })

  it('rebutja kind invàlid', () => {
    const r = examFeasibilityDraftSchema.safeParse({
      ...goBasicExam,
      exercises: [{ exercise_id: 'x', kind: 'x' }],
    })
    expect(r.success).toBe(false)
  })
})

describe('exerciseFeasibilityItemSchema', () => {
  it('rebutja weight_known true sense weight', () => {
    const r = exerciseFeasibilityItemSchema.safeParse({
      exercise_id: 'a',
      kind: 'd',
      weight_known: true,
    })
    expect(r.success).toBe(false)
  })
})

describe('feasibilityDecisionSchema / parseFeasibilityDecision', () => {
  it('accepta valors enum vàlids', () => {
    expect(feasibilityDecisionSchema.safeParse('apte').success).toBe(true)
    expect(parseFeasibilityDecision('no_apte').success).toBe(true)
  })

  it('rebutja payload de decisió invàlid', () => {
    const r = parseFeasibilityDecision('foo')
    expect(r.success).toBe(false)
  })
})
