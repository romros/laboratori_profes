import { describe, expect, it } from 'vitest'

import { goBasicExam } from '../../../fixtures/template-inference/go-basic'
import { mockTemplateDraftSource } from '../../../src/features/template-inference/services/mockTemplateDraftSource'

describe('mockTemplateDraftSource', () => {
  it('retorna un clon del draft go-basic (no la mateixa referència)', () => {
    const a = mockTemplateDraftSource.getDraft({ text: '' })
    const b = mockTemplateDraftSource.getDraft({ text: 'ignored' })

    expect(a).toEqual(goBasicExam)
    expect(b).toEqual(goBasicExam)
    expect(a).not.toBe(goBasicExam)
    expect(a).not.toBe(b)
  })
})
