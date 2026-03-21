import { describe, expect, it } from 'vitest'

import {
  CANONICAL_TEXT_AMBIGUOUS,
  CANONICAL_TEXT_CLEAR_TWO_QUESTIONS,
  CANONICAL_TEXT_REGRESSION_TWO_OPEN_ONLY,
  CANONICAL_TEXT_SEMI_STRUCTURED,
  CANONICAL_TEXT_TOO_SHORT,
} from '../../../fixtures/template-inference/feature0-canonical-text'
import { templateClearViableDraft } from '../../../fixtures/template-inference/template-clear-viable'
import { templateKoMixedPromptDraft } from '../../../fixtures/template-inference/template-ko-mixed-prompt'
import { templateKoUnstableLayoutDraft } from '../../../fixtures/template-inference/template-ko-unstable-layout'
import { executeFeature0AnalysisFromJsonBody } from '../../../src/features/template-inference/server/feature0AnalysisHttpRoute'
import { handleFeature0AnalysisStub } from '../../../src/features/template-inference/server/feature0AnalysisStubHandler'
import { validateTemplateFeasibility } from '../../../src/features/template-inference/services/validateTemplateFeasibility'

describe('Feature 0 — casos canònics (stub + route HTTP)', () => {
  it('too-short → ko', async () => {
    const res = await handleFeature0AnalysisStub({ text: CANONICAL_TEXT_TOO_SHORT })
    expect(res.status).toBe('ko')
    expect(res.debug?.rawDraft).toEqual({})
  })

  it('ambiguous → ko amb motiu layout', async () => {
    const res = await handleFeature0AnalysisStub({ text: CANONICAL_TEXT_AMBIGUOUS })
    expect(res.status).toBe('ko')
    if (res.status === 'ko') {
      expect(res.reasons.some((r) => r.includes('barrejats'))).toBe(true)
    }
    expect(res.debug?.rawDraft).toEqual(templateKoMixedPromptDraft)
  })

  it('clear-two-questions → ok estable amb regions', async () => {
    const res = await handleFeature0AnalysisStub({ text: CANONICAL_TEXT_CLEAR_TWO_QUESTIONS })
    expect(res.debug?.rawDraft).toEqual(templateClearViableDraft)
    expect(res.status).toBe('ok')
    if (res.status === 'ok') {
      expect(res.answer_regions.length).toBe(2)
      expect(res.answer_regions.every((r) => r.question_id && r.page >= 1)).toBe(true)
    }
  })

  it('regressió sentinel: validator rebutja barreja; resposta sense errors opacs', async () => {
    const raw = validateTemplateFeasibility(templateKoMixedPromptDraft)
    expect(raw.status).toBe('ko')

    const res = await handleFeature0AnalysisStub({ text: CANONICAL_TEXT_REGRESSION_TWO_OPEN_ONLY })
    expect(res.debug?.rawDraft).toEqual(templateKoMixedPromptDraft)
    expect(res.status).toBe('ko')
    if (res.status === 'ko') {
      expect(res.reasons.join(' ')).not.toMatch(/ZodIssueCode|safeParse/)
    }
  })

  it('semi-structured → ko layout inestable', async () => {
    const res = await handleFeature0AnalysisStub({ text: CANONICAL_TEXT_SEMI_STRUCTURED })
    expect(res.debug?.rawDraft).toEqual(templateKoUnstableLayoutDraft)
    expect(res.status).toBe('ko')
    if (res.status === 'ko') {
      expect(res.reasons.some((r) => r.includes('Layout de la plantilla'))).toBe(true)
    }
  })

  it('executeFeature0AnalysisFromJsonBody mateixa presentacio (regressio)', async () => {
    const out = await executeFeature0AnalysisFromJsonBody(
      JSON.stringify({ text: CANONICAL_TEXT_REGRESSION_TWO_OPEN_ONLY }),
    )
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.body.status).toBe('ko')
    }
  })
})
