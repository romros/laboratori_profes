import { describe, expect, it } from 'vitest'

import { extractJsonObjectFromModelText } from '../../../src/features/template-inference/services/extractJsonObjectFromModelText'

describe('extractJsonObjectFromModelText', () => {
  it('parseja objecte pla', () => {
    const o = extractJsonObjectFromModelText('{"a":1}')
    expect(o).toEqual({ a: 1 })
  })

  it('extreu JSON dins bloc markdown', () => {
    const o = extractJsonObjectFromModelText('```json\n{"x":true}\n```')
    expect(o).toEqual({ x: true })
  })

  it('rebutja JSON invàlid', () => {
    expect(() => extractJsonObjectFromModelText('{')).toThrow('JSON invàlid')
  })

  it('rebutja array arrel', () => {
    expect(() => extractJsonObjectFromModelText('[1]')).toThrow('objecte JSON')
  })
})
