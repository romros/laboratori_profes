import { describe, expect, it } from 'vitest'

import { templateClearViableDraft } from '../../../fixtures/template-inference/template-clear-viable'
import {
  answerRegionSchema,
  templateFeasibilityDraftSchema,
} from '../../../src/domain/template-inference/template_feasibility.schema'

describe('templateFeasibilityDraftSchema', () => {
  it('accepta esborrany viable', () => {
    const r = templateFeasibilityDraftSchema.safeParse(templateClearViableDraft)
    expect(r.success).toBe(true)
  })

  it('rebutja bbox fora de rang', () => {
    const r = templateFeasibilityDraftSchema.safeParse({
      layout_stable: true,
      answer_regions: [{ question_id: '1', page: 1, bbox: { x: 0.9, y: 0, w: 0.5, h: 0.1 } }],
    })
    expect(r.success).toBe(false)
  })
})

describe('answerRegionSchema', () => {
  it('accepta regió vàlida', () => {
    const r = answerRegionSchema.safeParse(templateClearViableDraft.answer_regions[0])
    expect(r.success).toBe(true)
  })
})
