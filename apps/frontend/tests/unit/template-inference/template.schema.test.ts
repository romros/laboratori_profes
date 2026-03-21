import { describe, expect, it } from 'vitest'

import { templateDraftSchema } from '../../../src/domain/template-inference/template.schema'

describe('templateDraftSchema', () => {
  it('rebutja coordenades fora de 0..1', () => {
    const r = templateDraftSchema.safeParse({
      regions: [{ exercise_id: 'a', bbox: { x: 0, y: 0, w: 1.2, h: 0.1 } }],
    })
    expect(r.success).toBe(false)
  })

  it('rebutja x+w > 1', () => {
    const r = templateDraftSchema.safeParse({
      regions: [{ exercise_id: 'a', bbox: { x: 0.6, y: 0, w: 0.5, h: 0.2 } }],
    })
    expect(r.success).toBe(false)
  })

  it('rebutja exercise_id duplicat', () => {
    const r = templateDraftSchema.safeParse({
      regions: [
        { exercise_id: 'same', bbox: { x: 0, y: 0, w: 0.2, h: 0.2 } },
        { exercise_id: 'same', bbox: { x: 0.3, y: 0, w: 0.2, h: 0.2 } },
      ],
    })
    expect(r.success).toBe(false)
  })
})
