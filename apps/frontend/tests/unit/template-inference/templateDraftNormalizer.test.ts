import { describe, expect, it } from 'vitest'

import { normalizeTemplateDraft } from '../../../src/features/template-inference/services/templateDraftNormalizer'

describe('normalizeTemplateDraft', () => {
  it('omple arrays opcionals absents amb buits', () => {
    const raw = {
      layout_stable: true,
      answer_regions: [{ question_id: '1', page: 1, bbox: { x: 0, y: 0, w: 1, h: 0.1 } }],
    }

    const out = normalizeTemplateDraft(raw) as Record<string, unknown>

    expect(Array.isArray(out.answer_regions)).toBe(true)
    expect((out.answer_regions as unknown[]).length).toBe(1)
    expect(Array.isArray(out.anchors)).toBe(true)
    expect(out.anchors).toEqual([])
    expect(Array.isArray(out.limitations)).toBe(true)
  })

  it('no altera booleans explicitament definits', () => {
    const raw = {
      layout_stable: false,
      answer_regions: [],
    }
    const out = normalizeTemplateDraft(structuredClone(raw)) as Record<string, unknown>
    expect(out.layout_stable).toBe(false)
  })

  it('no muta entrada', () => {
    const raw: Record<string, unknown> = { layout_stable: true }
    const snapshot = structuredClone(raw)
    normalizeTemplateDraft(raw)
    expect(raw).toEqual(snapshot)
  })

  it('retorna input si no es objecte pla', () => {
    expect(normalizeTemplateDraft(null)).toBe(null)
    expect(normalizeTemplateDraft('x')).toBe('x')
    expect(normalizeTemplateDraft(1)).toBe(1)
    expect(normalizeTemplateDraft([1, 2])).toEqual([1, 2])
  })
})
