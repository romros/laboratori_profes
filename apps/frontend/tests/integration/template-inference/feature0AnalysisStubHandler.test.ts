import { describe, expect, it } from 'vitest'

import { goBasicExam } from '../../../fixtures/template-inference/go-basic'
import { parseFeature0AnalysisRequest } from '../../../src/features/template-inference/contracts/feature0AnalysisContract'
import { handleFeature0AnalysisStub } from '../../../src/features/template-inference/server/feature0AnalysisStubHandler'

describe('Feature 0 — contracte + handleFeature0AnalysisStub (stub local)', () => {
  describe('parseFeature0AnalysisRequest', () => {
    it('accepta request vàlid', () => {
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
    it('retorna shape estable (rawDraft, normalizedDraft, validated)', async () => {
      const res = await handleFeature0AnalysisStub({ text: '1234567890 examen stub' })

      expect(Object.keys(res).sort()).toEqual(['normalizedDraft', 'rawDraft', 'validated'])
      expect('ok' in res.validated).toBe(true)
    })

    it('text vàlid → validated apte', async () => {
      const { validated } = await handleFeature0AnalysisStub({
        text: '1234567890 examen vàlid',
      })

      expect(validated.ok).toBe(true)
      if (validated.ok) {
        expect(validated.decision).toBe('apte')
      }
    })

    it('text curt → no_apte', async () => {
      const { rawDraft, validated } = await handleFeature0AnalysisStub({ text: 'curt' })

      expect(rawDraft).toEqual({})
      expect(validated.ok).toBe(false)
      if (!validated.ok) {
        expect(validated.decision).toBe('no_apte')
      }
    })

    it('text amb ??? → no_apte (dubte §6)', async () => {
      const { rawDraft, validated } = await handleFeature0AnalysisStub({
        text: '1234567890 amb ???',
      })

      expect((rawDraft as Record<string, unknown>).doubt_on_seminanonimitzable).toBe(true)
      expect(validated.ok).toBe(false)
      if (!validated.ok) {
        expect(validated.decision).toBe('no_apte')
      }
    })

    it('rawDraft coherent amb pipeline stub (go-basic quan apte)', async () => {
      const { rawDraft } = await handleFeature0AnalysisStub({
        text: '1234567890 sense ambigüitat',
      })
      expect(rawDraft).toEqual(goBasicExam)
    })
  })
})
