import { describe, expect, it } from 'vitest'

import { CANONICAL_TEXT_REGRESSION_TWO_OPEN_ONLY } from '../../../fixtures/template-inference/feature0-canonical-text'
import { templateClearViableDraft } from '../../../fixtures/template-inference/template-clear-viable'
import { templateKoMixedPromptDraft } from '../../../fixtures/template-inference/template-ko-mixed-prompt'
import { analyzeExamText } from '../../../src/features/template-inference/services/llmTemplateAnalyzer'
import { llmTemplateDraftSourceStub } from '../../../src/features/template-inference/services/llmTemplateDraftSourceStub'
import { mockTemplateDraftSource } from '../../../src/features/template-inference/services/mockTemplateDraftSource'
import { simpleRuleBasedDraftSource } from '../../../src/features/template-inference/services/simpleRuleBasedDraftSource'
import type { TemplateDraftSource } from '../../../src/features/template-inference/services/templateDraftSource'

describe('analyzeExamText', () => {
  it('amb mockTemplateDraftSource retorna status ok i regions', async () => {
    const { rawDraft, normalizedDraft, result } = await analyzeExamText(
      { text: 'mock exam body' },
      mockTemplateDraftSource,
    )

    expect(rawDraft).toEqual(templateClearViableDraft)
    expect(normalizedDraft).toBeDefined()
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.answer_regions.length).toBeGreaterThan(0)
    }
  })

  it('usa la font injectada per obtenir rawDraft (sense barrejar amb el validator)', async () => {
    const marker = { kind: 'injected-marker' as const }
    const source: TemplateDraftSource = {
      getDraft() {
        return { ...marker, answer_regions: [] }
      },
    }

    const { rawDraft, result } = await analyzeExamText({ text: 'x' }, source)

    expect((rawDraft as Record<string, unknown>).kind).toBe('injected-marker')
    expect(result.status).toBe('ko')
  })

  it('accepta font async (Promise<unknown>)', async () => {
    const source: TemplateDraftSource = {
      async getDraft() {
        return { answer_regions: [] }
      },
    }

    const { rawDraft } = await analyzeExamText({ text: 'async' }, source)
    expect(rawDraft).toEqual({ answer_regions: [] })
  })

  describe('amb simpleRuleBasedDraftSource (pipeline text → draft → validator)', () => {
    it('text curt → rawDraft buit i ko', async () => {
      const { rawDraft, result } = await analyzeExamText(
        { text: 'curt' },
        simpleRuleBasedDraftSource,
      )

      expect(rawDraft).toEqual({})
      expect(result.status).toBe('ko')
    })

    it('text amb ??? → ko (barreja)', async () => {
      const { rawDraft, result } = await analyzeExamText(
        { text: '1234567890 amb ???' },
        simpleRuleBasedDraftSource,
      )

      expect(rawDraft).toEqual(templateKoMixedPromptDraft)
      expect(result.status).toBe('ko')
      if (result.status === 'ko') {
        expect(result.reasons.some((r) => r.includes('barrejats'))).toBe(true)
      }
    })

    it('text vàlid → ok', async () => {
      const { result } = await analyzeExamText(
        { text: '1234567890 examen sense ambigüitat' },
        simpleRuleBasedDraftSource,
      )

      expect(result.status).toBe('ok')
      if (result.status === 'ok') {
        expect(result.answer_regions).toHaveLength(2)
      }
    })
  })

  describe('amb llmTemplateDraftSourceStub', () => {
    it('analyzeExamText retorna pipeline coherent', async () => {
      const { rawDraft, normalizedDraft, result } = await analyzeExamText(
        { text: '1234567890 pipeline stub LLM' },
        llmTemplateDraftSourceStub,
      )

      expect(rawDraft).toEqual(templateClearViableDraft)
      expect(typeof normalizedDraft).toBe('object')
      expect(result.status).toBe('ok')
    })

    it('regressió canonical: ko amb motiu de negoci (no patró tècnic cru)', async () => {
      const { result } = await analyzeExamText(
        { text: CANONICAL_TEXT_REGRESSION_TWO_OPEN_ONLY },
        llmTemplateDraftSourceStub,
      )
      expect(result.status).toBe('ko')
      if (result.status === 'ko') {
        expect(result.reasons.join(' ')).not.toMatch(/String\(/)
        expect(result.reasons.some((r) => r.length > 10)).toBe(true)
      }
    })
  })
})
