import { describe, expect, it } from 'vitest'

import { goBasicExam } from '../../../fixtures/template-inference/go-basic'
import { executeFeature0AnalysisFromJsonBody } from '../../../src/features/template-inference/server/feature0AnalysisHttpRoute'

describe('executeFeature0AnalysisFromJsonBody (route local)', () => {
  it('JSON invàlid → 400', async () => {
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

  it('request vàlid, text llarg → 200 i Feature0AnalysisResponse apte', async () => {
    const out = await executeFeature0AnalysisFromJsonBody(
      JSON.stringify({ text: '1234567890 examen http' }),
    )
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.body.rawDraft).toEqual(goBasicExam)
      expect(out.body.validated.ok).toBe(true)
      if (out.body.validated.ok) {
        expect(out.body.validated.decision).toBe('apte')
      }
    }
  })

  it('text curt → 200 i no_apte al validator', async () => {
    const out = await executeFeature0AnalysisFromJsonBody(JSON.stringify({ text: 'curt' }))
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.body.validated.ok).toBe(false)
      if (!out.body.validated.ok) {
        expect(out.body.validated.decision).toBe('no_apte')
      }
    }
  })

  it('text amb ??? → 200 i no_apte', async () => {
    const out = await executeFeature0AnalysisFromJsonBody(
      JSON.stringify({ text: '1234567890 ???' }),
    )
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.body.validated.ok).toBe(false)
    }
  })
})
