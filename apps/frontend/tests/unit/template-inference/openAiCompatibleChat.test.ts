import { describe, expect, it, vi } from 'vitest'

import {
  callOpenAiCompatibleChat,
  callOpenAiCompatibleChatWithMeta,
} from '../../../src/features/template-inference/services/openAiCompatibleChat'

describe('callOpenAiCompatibleChat', () => {
  it('retorna message.content quan HTTP OK', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"ok":true}' } }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
    )
    const text = await callOpenAiCompatibleChat({
      apiKey: 'k',
      baseUrl: 'https://api.example.com/v1',
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      fetchImpl,
    })
    expect(text).toBe('{"ok":true}')
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.example.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('HTTP error → Error amb prefix API model', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: { message: 'Invalid' } }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
    )
    await expect(
      callOpenAiCompatibleChat({
        apiKey: 'k',
        baseUrl: 'https://api.openai.com/v1',
        model: 'm',
        messages: [{ role: 'user', content: 'x' }],
        fetchImpl,
      }),
    ).rejects.toThrow('API model:')
  })

  it('callOpenAiCompatibleChatWithMeta retorna latència i usage quan ve al cos', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: 'ok' } }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
    )
    const r = await callOpenAiCompatibleChatWithMeta({
      apiKey: 'k',
      baseUrl: 'https://api.example.com/v1',
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      fetchImpl,
    })
    expect(r.content).toBe('ok')
    expect(r.latencyMs).toBeGreaterThanOrEqual(0)
    expect(r.usage).toEqual({
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
    })
  })
})
