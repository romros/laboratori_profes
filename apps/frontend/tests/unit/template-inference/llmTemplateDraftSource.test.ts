import { describe, expect, it, vi } from 'vitest'

import { templateClearViableDraft } from '../../../fixtures/template-inference/template-clear-viable'
import { createLlmTemplateDraftSource } from '../../../src/features/template-inference/services/llmTemplateDraftSource'

describe('createLlmTemplateDraftSource', () => {
  it('retorna draft parsejat quan l’API retorna JSON vàlid', async () => {
    const payload = JSON.stringify(templateClearViableDraft)
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: payload } }],
          }),
          { status: 200 },
        ),
    )
    const source = createLlmTemplateDraftSource({ apiKey: 'test', fetchImpl })
    const draft = await source.getDraft({ text: '1234567890 examen' })
    expect(draft).toEqual(templateClearViableDraft)
  })

  it('propaga error si el model retorna text no JSON', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: 'no json' } }],
          }),
          { status: 200 },
        ),
    )
    const source = createLlmTemplateDraftSource({ apiKey: 'k', fetchImpl })
    await expect(source.getDraft({ text: '1234567890 x' })).rejects.toThrow('JSON invàlid')
  })
})
