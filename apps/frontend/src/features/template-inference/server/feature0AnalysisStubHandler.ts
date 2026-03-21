import {
  parseFeature0AnalysisRequest,
  type Feature0AnalysisResponse,
} from '../contracts/feature0AnalysisContract'
import { analyzeExamText } from '../services/llmTemplateAnalyzer'
import { llmTemplateDraftSourceStub } from '../services/llmTemplateDraftSourceStub'

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
