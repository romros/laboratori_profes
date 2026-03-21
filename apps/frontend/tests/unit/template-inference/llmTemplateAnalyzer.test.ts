import { describe, expect, it } from 'vitest'

import { analyzeExamText } from '../../../src/features/template-inference/services/llmTemplateAnalyzer'
import { mockTemplateDraftSource } from '../../../src/features/template-inference/services/mockTemplateDraftSource'
import type { TemplateDraftSource } from '../../../src/features/template-inference/services/templateDraftSource'

describe('analyzeExamText', () => {
  it('amb mockTemplateDraftSource retorna rawDraft, normalizedDraft i validated apte', async () => {
    const { rawDraft, normalizedDraft, validated } = await analyzeExamText(
      { text: 'mock exam body' },
      mockTemplateDraftSource,
    )

    expect(rawDraft).toBeDefined()
    expect(typeof rawDraft).toBe('object')
    expect(normalizedDraft).toBeDefined()
    expect(typeof normalizedDraft).toBe('object')
    expect(Array.isArray((normalizedDraft as Record<string, unknown>).proposed_limitations)).toBe(
      true,
    )

    expect(validated.ok).toBe(true)
    if (validated.ok) {
      expect(validated.decision).toBe('apte')
    }
  })

  it('usa la font injectada per obtenir rawDraft (sense barrejar amb el validator)', async () => {
    const marker = { kind: 'injected-marker' as const }
    const source: TemplateDraftSource = {
      getDraft() {
        return { ...marker, proposed_limitations: [] }
      },
    }

    const { rawDraft, validated } = await analyzeExamText({ text: 'x' }, source)

    expect((rawDraft as Record<string, unknown>).kind).toBe('injected-marker')
    expect(validated.ok).toBe(false)
  })

  it('accepta font async (Promise<unknown>)', async () => {
    const source: TemplateDraftSource = {
      async getDraft() {
        return { proposed_limitations: [] }
      },
    }

    const { rawDraft } = await analyzeExamText({ text: 'async' }, source)
    expect(rawDraft).toEqual({ proposed_limitations: [] })
  })
})
