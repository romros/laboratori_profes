import { describe, expect, it } from 'vitest'

import { goBasicExam } from '../../../fixtures/template-inference/go-basic'
import { analyzeExamText } from '../../../src/features/template-inference/services/llmTemplateAnalyzer'
import { llmTemplateDraftSourceStub } from '../../../src/features/template-inference/services/llmTemplateDraftSourceStub'
import { mockTemplateDraftSource } from '../../../src/features/template-inference/services/mockTemplateDraftSource'
import { simpleRuleBasedDraftSource } from '../../../src/features/template-inference/services/simpleRuleBasedDraftSource'
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

  describe('amb simpleRuleBasedDraftSource (pipeline text → draft → validator)', () => {
    it('text curt → rawDraft buit i validated no_apte', async () => {
      const { rawDraft, validated } = await analyzeExamText(
        { text: 'curt' },
        simpleRuleBasedDraftSource,
      )

      expect(rawDraft).toEqual({})
      expect(validated.ok).toBe(false)
      if (!validated.ok) {
        expect(validated.decision).toBe('no_apte')
      }
    })

    it('text amb ??? → no_apte (dubte §6)', async () => {
      const { rawDraft, validated } = await analyzeExamText(
        { text: '1234567890 amb ???' },
        simpleRuleBasedDraftSource,
      )

      expect((rawDraft as Record<string, unknown>).doubt_on_seminanonimitzable).toBe(true)
      expect(validated.ok).toBe(false)
      if (!validated.ok) {
        expect(validated.decision).toBe('no_apte')
        expect(validated.reasons.some((r) => r.includes('§6'))).toBe(true)
      }
    })

    it('text vàlid → apte (go-basic)', async () => {
      const { validated } = await analyzeExamText(
        { text: '1234567890 examen sense ambigüitat' },
        simpleRuleBasedDraftSource,
      )

      expect(validated.ok).toBe(true)
      if (validated.ok) {
        expect(validated.decision).toBe('apte')
      }
    })
  })

  describe('amb llmTemplateDraftSourceStub (seam LLM sense API)', () => {
    it('analyzeExamText retorna rawDraft, normalizedDraft i validated coherents', async () => {
      const { rawDraft, normalizedDraft, validated } = await analyzeExamText(
        { text: '1234567890 pipeline stub LLM' },
        llmTemplateDraftSourceStub,
      )

      expect(rawDraft).toEqual(goBasicExam)
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
})
