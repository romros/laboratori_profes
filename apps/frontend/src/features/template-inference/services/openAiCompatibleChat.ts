export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type CallOpenAiCompatibleChatParams = {
  apiKey: string
  baseUrl: string
  model: string
  messages: ChatMessage[]
  /** Injecció per tests; per defecte `fetch` global. */
  fetchImpl?: typeof fetch
}

/** Camps habituals de `usage` a chat/completions (OpenAI i compatibles). */
export type OpenAiChatUsage = {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

export type CallOpenAiCompatibleChatMetaResult = {
  content: string
  latencyMs: number
  usage?: OpenAiChatUsage
}

function parseUsageFromBody(body: unknown): OpenAiChatUsage | undefined {
  if (typeof body !== 'object' || body === null || !('usage' in body)) {
    return undefined
  }
  const u = (body as { usage?: Record<string, unknown> }).usage
  if (typeof u !== 'object' || u === null) {
    return undefined
  }
  const prompt_tokens = u.prompt_tokens
  const completion_tokens = u.completion_tokens
  const total_tokens = u.total_tokens
  return {
    prompt_tokens: typeof prompt_tokens === 'number' ? prompt_tokens : undefined,
    completion_tokens: typeof completion_tokens === 'number' ? completion_tokens : undefined,
    total_tokens: typeof total_tokens === 'number' ? total_tokens : undefined,
  }
}

/**
 * Mateixa crida que `callOpenAiCompatibleChat`, amb latència i `usage` si l’API els retorna.
 */
export async function callOpenAiCompatibleChatWithMeta(
  params: CallOpenAiCompatibleChatParams,
): Promise<CallOpenAiCompatibleChatMetaResult> {
  const { apiKey, baseUrl, model, messages, fetchImpl = fetch } = params
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
  const t0 = performance.now()
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0,
    }),
  })

  const text = await res.text()
  const latencyMs = performance.now() - t0
  let body: unknown
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(`API model: cos no JSON (HTTP ${res.status})`)
  }

  if (!res.ok) {
    const errMsg =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as { error?: { message?: string } }).error?.message === 'string'
        ? (body as { error: { message: string } }).error.message
        : `HTTP ${res.status}`
    throw new Error(`API model: ${errMsg}`)
  }

  const choices = (body as { choices?: { message?: { content?: string } }[] }).choices
  const content = choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('API model: resposta sense contingut text')
  }

  const usage = parseUsageFromBody(body)
  return { content, latencyMs, usage }
}

/**
 * Crida mínima a POST /chat/completions (API compatible OpenAI). Sense SDK.
 */
export async function callOpenAiCompatibleChat(
  params: CallOpenAiCompatibleChatParams,
): Promise<string> {
  const r = await callOpenAiCompatibleChatWithMeta(params)
  return r.content
}
