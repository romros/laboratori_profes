export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type CallOpenAiCompatibleChatParams = {
  apiKey: string
  baseUrl: string
  model: string
  messages: ChatMessage[]
  /** Injecció per tests; per defecte `fetch` global. */
  fetchImpl?: typeof fetch
}

/**
 * Crida mínima a POST /chat/completions (API compatible OpenAI). Sense SDK.
 */
export async function callOpenAiCompatibleChat(
  params: CallOpenAiCompatibleChatParams,
): Promise<string> {
  const { apiKey, baseUrl, model, messages, fetchImpl = fetch } = params
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
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

  return content
}
