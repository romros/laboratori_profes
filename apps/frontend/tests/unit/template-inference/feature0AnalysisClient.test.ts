import { describe, expect, it, vi, afterEach } from 'vitest'

import { analyzeFeature0 } from '../../../src/features/template-inference/client/feature0AnalysisClient'

describe('analyzeFeature0', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('encapsula POST i retorna Feature0AnalysisResponse', async () => {
    const payload = {
      rawDraft: { x: 1 },
      normalizedDraft: { x: 1, proposed_limitations: [] },
      validated: { ok: true, decision: 'apte' as const, reasons: ['§7.2'] },
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    )

    const res = await analyzeFeature0('1234567890 prova')
    expect(res).toEqual(payload)
    expect(fetch).toHaveBeenCalledWith(
      '/api/feature0/analysis',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '1234567890 prova' }),
      }),
    )
  })

  it('status KO → Error amb missatge del cos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ error: 'Feature0AnalysisRequest: text ha de ser string' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
      ),
    )

    await expect(analyzeFeature0('x')).rejects.toThrow('text ha de ser string')
  })

  it('respecta baseUrl opcional', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              rawDraft: {},
              normalizedDraft: { proposed_limitations: [] },
              validated: { ok: false, decision: 'no_apte', reasons: [] },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
      ),
    )

    await analyzeFeature0('a', { baseUrl: 'http://localhost:5173' })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5173/api/feature0/analysis',
      expect.any(Object),
    )
  })
})
