import type { TemplateFeasibilityResult } from '../../../domain/template-inference/template_feasibility.schema'

import type { TemplateFeasibilityPipelineResult } from '../services/validateTemplateFeasibility'

/**
 * Contracte d’integració Feature 0: viabilitat de plantilla per extracció de regions de resposta.
 */
export type Feature0AnalysisRequest = {
  text: string
}

export type Feature0AnalysisResponse = TemplateFeasibilityResult & {
  /** Opcional: payload brut + normalitzat (demo / depuració). */
  debug?: { rawDraft: unknown; normalizedDraft: unknown }
}

export function packFeature0AnalysisResponse(
  pipeline: TemplateFeasibilityPipelineResult,
): Feature0AnalysisResponse {
  return {
    ...pipeline.result,
    debug: { rawDraft: pipeline.rawDraft, normalizedDraft: pipeline.normalizedDraft },
  }
}

/**
 * Validació mínima del cos entrant (p. ex. JSON deserialitzat).
 * Fail ràpid amb `TypeError` per mantenir `Feature0AnalysisResponse` només per èxit de pipeline.
 */
export function parseFeature0AnalysisRequest(input: unknown): Feature0AnalysisRequest {
  if (input === null || typeof input !== 'object') {
    throw new TypeError('Feature0AnalysisRequest: cal un objecte')
  }
  const text = (input as Record<string, unknown>).text
  if (typeof text !== 'string') {
    throw new TypeError('Feature0AnalysisRequest: text ha de ser string')
  }
  return { text }
}
