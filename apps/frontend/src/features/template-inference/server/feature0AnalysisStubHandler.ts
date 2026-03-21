import {
  parseFeature0AnalysisRequest,
  type Feature0AnalysisResponse,
} from '@/features/template-inference/contracts/feature0AnalysisContract'
import { analyzeExamText } from '@/features/template-inference/services/llmTemplateAnalyzer'
import { llmTemplateDraftSourceStub } from '@/features/template-inference/services/llmTemplateDraftSourceStub'

/**
 * Handler stub local (sense HTTP extern ni model real).
 * Punt d’ancoratge end-to-end: el mateix flux que cridarà un futur endpoint backend.
 */
export async function handleFeature0AnalysisStub(body: unknown): Promise<Feature0AnalysisResponse> {
  const { text } = parseFeature0AnalysisRequest(body)
  const { rawDraft, normalizedDraft, validated } = await analyzeExamText(
    { text },
    llmTemplateDraftSourceStub,
  )
  return { rawDraft, normalizedDraft, validated }
}
