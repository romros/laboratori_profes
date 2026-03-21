import { describe, expect, it, vi, afterEach } from 'vitest'

import {
  analyzeFeature0,
  analyzeFeature0WithLlm,
} from '../../../src/features/template-inference/client/feature0AnalysisClient'

describe('analyzeFeature0', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('encapsula POST i retorna Feature0AnalysisResponse', async () => {
    const payload = {
      status: 'ok' as const,
      answer_regions: [{ question_id: '1', page: 1, bbox: { x: 0.1, y: 0.2, w: 0.5, h: 0.1 } }],
      debug: { rawDraft: {}, normalizedDraft: {} },
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

  it('status KO Error amb missatge del cos', async () => {
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
              status: 'ko',
              reasons: ['test'],
              debug: { rawDraft: {}, normalizedDraft: {} },
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

  it('analyzeFeature0WithLlm usa ruta llm', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              status: 'ko',
              reasons: [],
              debug: { rawDraft: {}, normalizedDraft: {} },
            }),
            { status: 200 },
          ),
      ),
    )
    await analyzeFeature0WithLlm('1234567890 z')
    expect(fetch).toHaveBeenCalledWith('/api/feature0/analysis/llm', expect.any(Object))
  })
})
