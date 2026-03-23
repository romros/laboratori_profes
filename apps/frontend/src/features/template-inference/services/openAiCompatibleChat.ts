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
 * Models com `gpt-5.4-pro` només admeten la [Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses)
 * (`/v1/responses`), no `chat/completions`.
 */
export function openAiModelUsesResponsesApi(model: string): boolean {
  if (process.env.OPENAI_FORCE_CHAT_COMPLETIONS === '1') {
    return false
  }
  const m = model.trim().toLowerCase()
  if (m.startsWith('gpt-5.4-pro')) {
    return true
  }
  const extra = process.env.OPENAI_RESPONSES_API_MODELS?.split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return extra?.includes(m) ?? false
}

/** Extreu text útil del JSON de `POST /v1/responses` (camp `output_text` o ítems `message`). */
export function extractTextFromOpenAiResponsesBody(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) {
    return undefined
  }
  const b = body as Record<string, unknown>

  const outputText = b.output_text
  if (typeof outputText === 'string' && outputText.trim()) {
    return outputText.trim()
  }

  const output = b.output
  if (!Array.isArray(output)) {
    return undefined
  }

  const chunks: string[] = []
  for (const item of output) {
    if (typeof item !== 'object' || item === null) {
      continue
    }
    const o = item as Record<string, unknown>
    if (o.type !== 'message') {
      continue
    }
    const content = o.content
    if (typeof content === 'string' && content.trim()) {
      chunks.push(content.trim())
      continue
    }
    if (!Array.isArray(content)) {
      continue
    }
    for (const part of content) {
      if (typeof part !== 'object' || part === null) {
        continue
      }
      const p = part as Record<string, unknown>
      if (p.type === 'output_text' && typeof p.text === 'string') {
        chunks.push(p.text)
      }
    }
  }

  if (chunks.length === 0) {
    return undefined
  }
  return chunks.join('')
}

async function postOpenAiChatCompletionsWithMeta(
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
 * `POST /v1/responses` — necessari per a models com `gpt-5.4-pro`.
 * `input` reutilitza el mateix array de rols que Chat Completions (guia de migració OpenAI).
 */
async function postOpenAiResponsesWithMeta(
  params: CallOpenAiCompatibleChatParams,
): Promise<CallOpenAiCompatibleChatMetaResult> {
  const { apiKey, baseUrl, model, messages, fetchImpl = fetch } = params
  const url = `${baseUrl.replace(/\/$/, '')}/responses`
  const t0 = performance.now()
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: messages,
      temperature: 0,
      store: false,
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

  const extracted = extractTextFromOpenAiResponsesBody(body)
  if (extracted == null || !extracted.trim()) {
    throw new Error('API model: Responses sense text extret (output_text / output message)')
  }

  const usage = parseUsageFromBody(body)
  return { content: extracted.trim(), latencyMs, usage }
}

/**
 * Enruta a `chat/completions` o `responses` segons el model. Retorna latència i `usage` si l’API els envia.
 */
export async function callOpenAiCompatibleChatWithMeta(
  params: CallOpenAiCompatibleChatParams,
): Promise<CallOpenAiCompatibleChatMetaResult> {
  if (openAiModelUsesResponsesApi(params.model)) {
    return postOpenAiResponsesWithMeta(params)
  }
  return postOpenAiChatCompletionsWithMeta(params)
}

/**
 * Crida mínima compatible OpenAI. Sense SDK.
 */
export async function callOpenAiCompatibleChat(
  params: CallOpenAiCompatibleChatParams,
): Promise<string> {
  const r = await callOpenAiCompatibleChatWithMeta(params)
  return r.content
}
