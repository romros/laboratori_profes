import { describe, expect, it } from 'vitest'

import { regionSchema } from '../../../src/domain/template-inference/template.schema'

describe('regionSchema', () => {
  it('accepta caixa dins del full', () => {
    const r = regionSchema.safeParse({ x: 0.1, y: 0.2, w: 0.5, h: 0.3 })
    expect(r.success).toBe(true)
  })

  it('rebutja x+w>1', () => {
    const r = regionSchema.safeParse({ x: 0.6, y: 0, w: 0.5, h: 0.1 })
    expect(r.success).toBe(false)
  })
})
