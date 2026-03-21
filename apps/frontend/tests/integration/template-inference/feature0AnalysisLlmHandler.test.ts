import { describe, expect, it } from 'vitest'

import { goBasicExam } from '../../../fixtures/template-inference/go-basic'
import { handleFeature0AnalysisLlmWithSource } from '../../../src/features/template-inference/server/feature0AnalysisLlmHandler'
import { simpleRuleBasedDraftSource } from '../../../src/features/template-inference/services/simpleRuleBasedDraftSource'

describe('handleFeature0AnalysisLlmWithSource', () => {
  it('pipeline complet amb font injectada (sense crida HTTP)', async () => {
    const res = await handleFeature0AnalysisLlmWithSource(
      { text: '1234567890 examen vàlid' },
      simpleRuleBasedDraftSource,
    )
    expect(res.rawDraft).toEqual(goBasicExam)
    expect(res.validated.ok).toBe(true)
  })

  it('no decideix negoci: el validator classifica draft dolent', async () => {
    const res = await handleFeature0AnalysisLlmWithSource(
      { text: 'curt' },
      simpleRuleBasedDraftSource,
    )
    expect(res.validated.ok).toBe(false)
  })
})
