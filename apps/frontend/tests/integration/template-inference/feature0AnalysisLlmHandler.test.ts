import { describe, expect, it } from 'vitest'

import { templateClearViableDraft } from '../../../fixtures/template-inference/template-clear-viable'
import { handleFeature0AnalysisLlmWithSource } from '../../../src/features/template-inference/server/feature0AnalysisLlmHandler'
import { simpleRuleBasedDraftSource } from '../../../src/features/template-inference/services/simpleRuleBasedDraftSource'

describe('handleFeature0AnalysisLlmWithSource', () => {
  it('pipeline complet amb font injectada (sense crida HTTP)', async () => {
    const res = await handleFeature0AnalysisLlmWithSource(
      { text: '1234567890 examen valid' },
      simpleRuleBasedDraftSource,
    )
    expect(res.debug?.rawDraft).toEqual(templateClearViableDraft)
    expect(res.status).toBe('ok')
  })

  it('no decideix negoci: el validator classifica draft dolent', async () => {
    const res = await handleFeature0AnalysisLlmWithSource(
      { text: 'curt' },
      simpleRuleBasedDraftSource,
    )
    expect(res.status).toBe('ko')
  })
})
