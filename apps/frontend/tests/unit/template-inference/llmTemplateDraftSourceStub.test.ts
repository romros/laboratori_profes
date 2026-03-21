import { describe, expect, it } from 'vitest'

import { templateClearViableDraft } from '../../../fixtures/template-inference/template-clear-viable'
import {
  llmTemplateDraftSourceStub,
  simulateLlmDraftFromText,
} from '../../../src/features/template-inference/services/llmTemplateDraftSourceStub'

describe('llmTemplateDraftSourceStub', () => {
  it('implementa TemplateDraftSource: getDraft retorna esborrany de plantilla (text llarg)', () => {
    const d = llmTemplateDraftSourceStub.getDraft({
      text: '1234567890 stub exam',
    }) as Record<string, unknown>

    expect(typeof d).toBe('object')
    expect(Array.isArray(d.answer_regions)).toBe(true)
    expect(d).toEqual(templateClearViableDraft)
  })

  it('és determinista (mateix text → mateix payload estructural)', () => {
    const t = '1234567890 determinista'
    const a = llmTemplateDraftSourceStub.getDraft({ text: t })
    const b = llmTemplateDraftSourceStub.getDraft({ text: t })
    expect(a).toEqual(b)
  })

  it('simulateLlmDraftFromText és el nucli local que usa getDraft', () => {
    const t = '1234567890 nucli'
    expect(simulateLlmDraftFromText(t)).toEqual(llmTemplateDraftSourceStub.getDraft({ text: t }))
  })
})
