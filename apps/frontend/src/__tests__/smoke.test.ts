import { describe, expect, it } from 'vitest'
import { z } from 'zod'

describe('smoke', () => {
  it('executa Vitest', () => {
    expect(1 + 1).toBe(2)
  })

  it('Zod cablejat', () => {
    expect(z.string().parse('ok')).toBe('ok')
  })
})
