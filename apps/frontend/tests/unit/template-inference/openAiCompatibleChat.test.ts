import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  callOpenAiCompatibleChat,
  callOpenAiCompatibleChatWithMeta,
  extractTextFromOpenAiResponsesBody,
  openAiModelUsesResponsesApi,
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
    expect(r.endpointKind).toBe('chat_completions')
    expect(r.usage).toEqual({
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
    })
  })

  it('gpt-5.4-pro enruta a /v1/responses i llegeix output_text', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ output_text: '{"x":1}', usage: { total_tokens: 5 } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    )
    const r = await callOpenAiCompatibleChatWithMeta({
      apiKey: 'k',
      baseUrl: 'https://api.example.com/v1',
      model: 'gpt-5.4-pro',
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'hi' },
      ],
      fetchImpl,
    })
    expect(r.content).toBe('{"x":1}')
    expect(r.endpointKind).toBe('responses')
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.example.com/v1/responses',
      expect.objectContaining({ method: 'POST' }),
    )
    const call0 = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    const rawBody = JSON.parse(call0[1].body as string)
    expect(rawBody.model).toBe('gpt-5.4-pro')
    expect(rawBody.input).toHaveLength(2)
    expect(rawBody.store).toBe(false)
    expect('temperature' in rawBody).toBe(false)
  })

  it('Responses: extreu text de output[].content output_text', () => {
    const text = extractTextFromOpenAiResponsesBody({
      output: [
        { type: 'reasoning', id: 'r1' },
        {
          type: 'message',
          role: 'assistant',
          content: [{ type: 'output_text', text: 'hello' }],
        },
      ],
    })
    expect(text).toBe('hello')
  })
})

describe('openAiModelUsesResponsesApi', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('gpt-5.4-pro i snapshot → true', () => {
    expect(openAiModelUsesResponsesApi('gpt-5.4-pro')).toBe(true)
    expect(openAiModelUsesResponsesApi('gpt-5.4-pro-2026-03-05')).toBe(true)
  })

  it('gpt-5.4 / mini → false', () => {
    expect(openAiModelUsesResponsesApi('gpt-5.4')).toBe(false)
    expect(openAiModelUsesResponsesApi('gpt-5.4-mini')).toBe(false)
  })

  it('OPENAI_FORCE_CHAT_COMPLETIONS=1 → false fins i tot per pro', () => {
    vi.stubEnv('OPENAI_FORCE_CHAT_COMPLETIONS', '1')
    expect(openAiModelUsesResponsesApi('gpt-5.4-pro')).toBe(false)
  })

  it('OPENAI_RESPONSES_API_MODELS permet afegir models', () => {
    vi.stubEnv('OPENAI_RESPONSES_API_MODELS', 'custom-pro-model')
    expect(openAiModelUsesResponsesApi('custom-pro-model')).toBe(true)
  })
})
