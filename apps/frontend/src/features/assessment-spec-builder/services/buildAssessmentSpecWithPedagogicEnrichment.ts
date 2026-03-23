import type { AssessmentSpec } from '../../../domain/assessment-spec/assessmentSpec.schema'
import { buildAssessmentSpec, type BuildAssessmentSpecParams } from './buildAssessmentSpec'
import { enrichAssessmentSpec } from './enrichAssessmentSpec'

export type BuildAssessmentSpecWithPedagogicEnrichmentParams = BuildAssessmentSpecParams & {
  /** Override model passada 2; env `ASSESSMENT_SPEC_ENRICH_MODEL` si s’omet. */
  enrichModel?: string
  /** Opcional: telemetria o persistència del spec base abans d’enriqueir (calibratge). */
  onAfterBaseSpec?: (spec: AssessmentSpec) => void
}

/**
 * Pipeline Feature 2 + 2.1: extracció estructurada i segon pas d'enriqueiment pedagògic
 * (criteris observables, sense canviar schema). Les dues passades poden usar models diferents.
 */
export async function buildAssessmentSpecWithPedagogicEnrichment(
  params: BuildAssessmentSpecWithPedagogicEnrichmentParams,
): Promise<AssessmentSpec> {
  const { enrichModel, onAfterBaseSpec, ...baseParams } = params
  const base = await buildAssessmentSpec(baseParams)
  onAfterBaseSpec?.(base)
  /** Passada 2: mateixos `examText` / `solutionText` que la passada 1 → blocs ORIGINAL al prompt d’enriqueiment. */
  return enrichAssessmentSpec({
    spec: base,
    apiKey: baseParams.apiKey,
    baseUrl: baseParams.baseUrl,
    model: enrichModel,
    examText: baseParams.examText,
    solutionText: baseParams.solutionText,
    fetchImpl: baseParams.fetchImpl,
    onLlmRound: baseParams.onLlmRound,
  })
}
