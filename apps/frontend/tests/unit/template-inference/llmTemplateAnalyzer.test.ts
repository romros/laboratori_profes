import { describe, expect, it } from 'vitest'

import { analyzeExamText } from '../../../src/features/template-inference/services/llmTemplateAnalyzer'

describe('analyzeExamText (scaffold)', () => {
  it('retorna rawDraft, normalizedDraft i validated apte', () => {
    const { rawDraft, normalizedDraft, validated } = analyzeExamText({ text: 'mock exam body' })

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
})
