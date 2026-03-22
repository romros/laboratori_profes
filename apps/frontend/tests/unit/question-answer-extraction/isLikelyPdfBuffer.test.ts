import { describe, expect, it } from 'vitest'

import { isLikelyPdfBuffer } from '@/shared/pdf/isLikelyPdfBuffer'

describe('isLikelyPdfBuffer', () => {
  it('detecta capcalera PDF amb bytes inicials', () => {
    const buf = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('%PDF-1.4\n')])
    expect(isLikelyPdfBuffer(buf)).toBe(true)
  })

  it('rebutja text pla', () => {
    expect(isLikelyPdfBuffer(Buffer.from('no es cap pdf'))).toBe(false)
  })
})
