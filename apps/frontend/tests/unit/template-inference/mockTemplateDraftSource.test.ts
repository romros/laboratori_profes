import { describe, expect, it } from 'vitest'

import { templateClearViableDraft } from '../../../fixtures/template-inference/template-clear-viable'
import { mockTemplateDraftSource } from '../../../src/features/template-inference/services/mockTemplateDraftSource'

describe('mockTemplateDraftSource', () => {
  it('retorna un clon del draft viable (no la mateixa referencia)', () => {
    const a = mockTemplateDraftSource.getDraft({ text: '' })
    const b = mockTemplateDraftSource.getDraft({ text: 'ignored' })

    expect(a).toEqual(templateClearViableDraft)
    expect(b).toEqual(templateClearViableDraft)
    expect(a).not.toBe(templateClearViableDraft)
    expect(a).not.toBe(b)
  })
})
