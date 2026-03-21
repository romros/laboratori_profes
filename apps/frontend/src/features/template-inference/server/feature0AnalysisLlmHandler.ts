import {
  packFeature0AnalysisResponse,
  parseFeature0AnalysisRequest,
  type Feature0AnalysisResponse,
} from '../contracts/feature0AnalysisContract'
import { analyzeExamText } from '../services/llmTemplateAnalyzer'
import {
  createLlmTemplateDraftSource,
  createLlmTemplateDraftSourceFromEnv,
  type LlmTemplateDraftSourceOptions,
} from '../services/llmTemplateDraftSource'
import type { TemplateDraftSource } from '../services/templateDraftSource'

export class Feature0LlmNotConfiguredError extends Error {
  constructor() {
    super(
      'Feature 0 LLM: cal FEATURE0_OPENAI_API_KEY o OPENAI_API_KEY (servidor). Veure .env.example.',
    )
    this.name = 'Feature0LlmNotConfiguredError'
  }
}

/**
 * Permet tests injectant font sense env.
 */
export async function handleFeature0AnalysisLlmWithSource(
  body: unknown,
  source: TemplateDraftSource,
): Promise<Feature0AnalysisResponse> {
  const { text } = parseFeature0AnalysisRequest(body)
  const pipeline = await analyzeExamText({ text }, source)
  return packFeature0AnalysisResponse(pipeline)
}

export async function handleFeature0AnalysisLlm(body: unknown): Promise<Feature0AnalysisResponse> {
  const source = createLlmTemplateDraftSourceFromEnv()
  if (!source) {
    throw new Feature0LlmNotConfiguredError()
  }
  return handleFeature0AnalysisLlmWithSource(body, source)
}

/** Ús manual o futur wiring sense env (p. ex. integració test). */
export async function handleFeature0AnalysisLlmWithOptions(
  body: unknown,
  llmOptions: LlmTemplateDraftSourceOptions,
): Promise<Feature0AnalysisResponse> {
  return handleFeature0AnalysisLlmWithSource(body, createLlmTemplateDraftSource(llmOptions))
}
