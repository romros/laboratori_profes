import type { AssessmentSpec } from '../../../domain/assessment-spec/assessmentSpec.schema'
import { buildAssessmentSpec, type BuildAssessmentSpecParams } from './buildAssessmentSpec'
import { enrichAssessmentSpec } from './enrichAssessmentSpec'

/**
 * Pipeline Feature 2 + 2.1: extracció estructurada i segon pas d'enriqueiment pedagògic
 * (criteris observables, sense canviar schema).
 */
export async function buildAssessmentSpecWithPedagogicEnrichment(
  params: BuildAssessmentSpecParams,
): Promise<AssessmentSpec> {
  const base = await buildAssessmentSpec(params)
  return enrichAssessmentSpec({
    spec: base,
    apiKey: params.apiKey,
    baseUrl: params.baseUrl,
    model: params.model,
    fetchImpl: params.fetchImpl,
  })
}
