import { describe, expect, it } from 'vitest'

import { analyzeExamText } from '../../../src/features/template-inference/services/llmTemplateAnalyzer'

describe('analyzeExamText (scaffold)', () => {
  it('retorna validated apte sense errors de schema', () => {
    const { rawDraft, validated } = analyzeExamText({ text: 'mock exam body' })

    expect(rawDraft).toBeDefined()
    expect(typeof rawDraft).toBe('object')

    expect(validated.ok).toBe(true)
    if (validated.ok) {
      expect(validated.decision).toBe('apte')
    }
    expect(validated).not.toHaveProperty('schemaErrors')
  })
})
