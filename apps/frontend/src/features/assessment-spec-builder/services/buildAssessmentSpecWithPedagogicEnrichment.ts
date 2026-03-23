import type { AssessmentSpec } from '../../../domain/assessment-spec/assessmentSpec.schema'
import { buildAssessmentSpec, type BuildAssessmentSpecParams } from './buildAssessmentSpec'
import { enrichAssessmentSpec } from './enrichAssessmentSpec'

export type BuildAssessmentSpecWithPedagogicEnrichmentParams = BuildAssessmentSpecParams & {
  /** Override model passada 2; env `ASSESSMENT_SPEC_ENRICH_MODEL` si s’omet. */
  enrichModel?: string
}

/**
 * Pipeline Feature 2 + 2.1: extracció estructurada i segon pas d'enriqueiment pedagògic
 * (criteris observables, sense canviar schema). Les dues passades poden usar models diferents.
 */
export async function buildAssessmentSpecWithPedagogicEnrichment(
  params: BuildAssessmentSpecWithPedagogicEnrichmentParams,
): Promise<AssessmentSpec> {
  const { enrichModel, ...baseParams } = params
  const base = await buildAssessmentSpec(baseParams)
  return enrichAssessmentSpec({
    spec: base,
    apiKey: baseParams.apiKey,
    baseUrl: baseParams.baseUrl,
    model: enrichModel,
    fetchImpl: baseParams.fetchImpl,
    onLlmRound: baseParams.onLlmRound,
  })
}
