import type { ValidateTemplateDraftResult } from '@/features/template-inference/services/validateTemplateDraft'

/**
 * Contracte d’integració Feature 0: frontera estable entre UI i futur backend.
 * El transport (fetch, route, etc.) vindrà després; el payload es manté igual.
 */
export type Feature0AnalysisRequest = {
  text: string
}

export type Feature0AnalysisResponse = {
  rawDraft: unknown
  normalizedDraft: unknown
  validated: ValidateTemplateDraftResult
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
