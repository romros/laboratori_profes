import { buildTemplateFeasibilityPrompt } from './buildTemplateFeasibilityPrompt'
import { extractJsonObjectFromModelText } from './extractJsonObjectFromModelText'
import { callOpenAiCompatibleChat } from './openAiCompatibleChat'
import type { TemplateDraftSource } from './templateDraftSource'

const DEFAULT_BASE = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'

export type LlmTemplateDraftSourceOptions = {
  apiKey: string
  baseUrl?: string
  model?: string
  fetchImpl?: typeof fetch
}

/**
 * Font real: crida al model des del servidor (Node); retorna només `unknown` per al pipeline.
 */
export function createLlmTemplateDraftSource(
  options: LlmTemplateDraftSourceOptions,
): TemplateDraftSource {
  const baseUrl = options.baseUrl?.trim() || DEFAULT_BASE
  const model = options.model?.trim() || DEFAULT_MODEL
  const fetchImpl = options.fetchImpl

  return {
    async getDraft({ text }): Promise<unknown> {
      const userPrompt = buildTemplateFeasibilityPrompt(text)
      const content = await callOpenAiCompatibleChat({
        apiKey: options.apiKey,
        baseUrl,
        model,
        messages: [
          {
            role: 'system',
            content:
              'Ets un extractor estructurat. Respon únicament amb un objecte JSON vàlid, sense markdown.',
          },
          { role: 'user', content: userPrompt },
        ],
        fetchImpl,
      })
      return extractJsonObjectFromModelText(content)
    },
  }
}

/** Llegeix configuració del procés (Vite dev carrega `.env` al servidor). */
export function createLlmTemplateDraftSourceFromEnv(): TemplateDraftSource | null {
  const apiKey = process.env.FEATURE0_OPENAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return null
  }
  return createLlmTemplateDraftSource({
    apiKey,
    baseUrl: process.env.FEATURE0_OPENAI_BASE_URL,
    model: process.env.FEATURE0_OPENAI_MODEL,
  })
}
