import { describe, expect, it } from 'vitest'

import { templateClearViableDraft } from '../../../fixtures/template-inference/template-clear-viable'
import { templateKoMixedPromptDraft } from '../../../fixtures/template-inference/template-ko-mixed-prompt'
import { parseFeature0AnalysisRequest } from '../../../src/features/template-inference/contracts/feature0AnalysisContract'
import { handleFeature0AnalysisStub } from '../../../src/features/template-inference/server/feature0AnalysisStubHandler'

describe('Feature 0 — contracte + handleFeature0AnalysisStub (stub local)', () => {
  describe('parseFeature0AnalysisRequest', () => {
    it('accepta request valid', () => {
      expect(parseFeature0AnalysisRequest({ text: 'hola' })).toEqual({ text: 'hola' })
    })

    it('rebutja cos no objecte', () => {
      expect(() => parseFeature0AnalysisRequest(null)).toThrow(TypeError)
      expect(() => parseFeature0AnalysisRequest('x')).toThrow(TypeError)
    })

    it('rebutja text no string', () => {
      expect(() => parseFeature0AnalysisRequest({ text: 1 })).toThrow(TypeError)
    })
  })

  describe('handleFeature0AnalysisStub', () => {
    it('retorna status ok i debug', async () => {
      const res = await handleFeature0AnalysisStub({ text: '1234567890 examen stub' })

      expect(res.status).toBe('ok')
      expect(res.debug?.rawDraft).toEqual(templateClearViableDraft)
      expect(res.debug?.normalizedDraft).toBeDefined()
    })

    it('text valid → status ok', async () => {
      const res = await handleFeature0AnalysisStub({
        text: '1234567890 examen valid',
      })

      expect(res.status).toBe('ok')
    })

    it('text curt → ko', async () => {
      const res = await handleFeature0AnalysisStub({ text: 'curt' })

      expect(res.debug?.rawDraft).toEqual({})
      expect(res.status).toBe('ko')
      if (res.status === 'ko') {
        expect(res.reasons.length).toBeGreaterThan(0)
      }
    })

    it('text amb ??? → ko barreja', async () => {
      const res = await handleFeature0AnalysisStub({
        text: '1234567890 amb ???',
      })

      expect(res.debug?.rawDraft).toEqual(templateKoMixedPromptDraft)
      expect(res.status).toBe('ko')
    })

    it('debug rawDraft coherent quan ok', async () => {
      const res = await handleFeature0AnalysisStub({
        text: '1234567890 sense ambiguitat',
      })
      expect(res.debug?.rawDraft).toEqual(templateClearViableDraft)
    })
  })
})
