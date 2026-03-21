import type { Feature0AnalysisResponse } from '../contracts/feature0AnalysisContract'

import {
  Feature0LlmNotConfiguredError,
  handleFeature0AnalysisLlm,
} from './feature0AnalysisLlmHandler'

export type Feature0AnalysisLlmHttpSuccess = {
  ok: true
  status: 200
  body: Feature0AnalysisResponse
}

export type Feature0AnalysisLlmHttpError = {
  ok: false
  status: 400 | 502 | 503
  body: { error: string }
}

export async function executeFeature0AnalysisLlmFromJsonBody(
  jsonString: string,
): Promise<Feature0AnalysisLlmHttpSuccess | Feature0AnalysisLlmHttpError> {
  let parsed: unknown
  try {
    parsed = jsonString.trim() === '' ? {} : JSON.parse(jsonString)
  } catch {
    return { ok: false, status: 400, body: { error: 'JSON invàlid' } }
  }

  try {
    const body = await handleFeature0AnalysisLlm(parsed)
    return { ok: true, status: 200, body }
  } catch (e) {
    if (e instanceof Feature0LlmNotConfiguredError) {
      return { ok: false, status: 503, body: { error: e.message } }
    }
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.startsWith('Feature0AnalysisRequest:') || msg.startsWith('Resposta del model:')) {
      return { ok: false, status: 400, body: { error: msg } }
    }
    if (msg.startsWith('API model:')) {
      return { ok: false, status: 502, body: { error: msg } }
    }
    return { ok: false, status: 502, body: { error: msg } }
  }
}
