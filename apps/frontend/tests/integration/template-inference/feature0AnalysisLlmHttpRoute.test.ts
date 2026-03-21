import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { goBasicExam } from '../../../fixtures/template-inference/go-basic'
import { executeFeature0AnalysisLlmFromJsonBody } from '../../../src/features/template-inference/server/feature0AnalysisLlmHttpRoute'

describe('executeFeature0AnalysisLlmFromJsonBody', () => {
  const envKeys = ['FEATURE0_OPENAI_API_KEY', 'OPENAI_API_KEY'] as const

  beforeEach(() => {
    for (const k of envKeys) {
      delete process.env[k]
    }
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    for (const k of envKeys) {
      delete process.env[k]
    }
    vi.unstubAllGlobals()
  })

  it('sense clau API → 503', async () => {
    const out = await executeFeature0AnalysisLlmFromJsonBody(
      JSON.stringify({ text: '1234567890 x' }),
    )
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.status).toBe(503)
      expect(out.body.error).toMatch(/FEATURE0_OPENAI_API_KEY|OPENAI_API_KEY/)
    }
  })

  it('amb clau i fetch simulat → 200 i contracte', async () => {
    process.env.FEATURE0_OPENAI_API_KEY = 'test-key'
    const content = JSON.stringify(goBasicExam)
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              choices: [{ message: { content } }],
            }),
            { status: 200 },
          ),
      ),
    )

    const out = await executeFeature0AnalysisLlmFromJsonBody(
      JSON.stringify({ text: '1234567890 examen simulat' }),
    )
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.body.validated.ok).toBe(true)
      if (out.body.validated.ok) {
        expect(out.body.validated.decision).toBe('apte')
      }
    }
  })

  it('API retorna error HTTP → 502', async () => {
    process.env.FEATURE0_OPENAI_API_KEY = 'bad'
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response(JSON.stringify({ error: { message: 'nope' } }), { status: 401 }),
      ),
    )

    const out = await executeFeature0AnalysisLlmFromJsonBody(
      JSON.stringify({ text: '1234567890 x' }),
    )
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.status).toBe(502)
    }
  })
})
