import type { Feature0AnalysisResponse } from '../contracts/feature0AnalysisContract'

import { handleFeature0AnalysisStub } from './feature0AnalysisStubHandler'

export type Feature0AnalysisHttpSuccess = {
  ok: true
  status: 200
  body: Feature0AnalysisResponse
}

export type Feature0AnalysisHttpError = {
  ok: false
  status: 400
  body: { error: string }
}

/**
 * Cos JSON → mateix contracte que exposarà un futur POST HTTP.
 * Ús: plugin Vite (dev/preview) i tests sense servidor real.
 */
export async function executeFeature0AnalysisFromJsonBody(
  jsonString: string,
): Promise<Feature0AnalysisHttpSuccess | Feature0AnalysisHttpError> {
  let parsed: unknown
  try {
    parsed = jsonString.trim() === '' ? {} : JSON.parse(jsonString)
  } catch {
    return { ok: false, status: 400, body: { error: 'JSON invàlid' } }
  }
  try {
    const body = await handleFeature0AnalysisStub(parsed)
    return { ok: true, status: 200, body }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, status: 400, body: { error: msg } }
  }
}
