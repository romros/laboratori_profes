import { describe, expect, it } from 'vitest'

import { templateClearViableDraft } from '../../../fixtures/template-inference/template-clear-viable'
import { executeFeature0AnalysisFromJsonBody } from '../../../src/features/template-inference/server/feature0AnalysisHttpRoute'

describe('executeFeature0AnalysisFromJsonBody (route local)', () => {
  it('JSON invalid → 400', async () => {
    const out = await executeFeature0AnalysisFromJsonBody('{')
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.status).toBe(400)
      expect(out.body.error).toContain('JSON')
    }
  })

  it('payload sense text → 400', async () => {
    const out = await executeFeature0AnalysisFromJsonBody('{}')
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.status).toBe(400)
    }
  })

  it('request valid text llarg → 200 i status ok', async () => {
    const out = await executeFeature0AnalysisFromJsonBody(
      JSON.stringify({ text: '1234567890 examen http' }),
    )
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.body.debug?.rawDraft).toEqual(templateClearViableDraft)
      expect(out.body.status).toBe('ok')
      if (out.body.status === 'ok') {
        expect(out.body.answer_regions.length).toBeGreaterThan(0)
      }
    }
  })

  it('text curt → 200 i ko', async () => {
    const out = await executeFeature0AnalysisFromJsonBody(JSON.stringify({ text: 'curt' }))
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.body.status).toBe('ko')
    }
  })

  it('text amb ??? → 200 i ko', async () => {
    const out = await executeFeature0AnalysisFromJsonBody(
      JSON.stringify({ text: '1234567890 ???' }),
    )
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.body.status).toBe('ko')
    }
  })
})
