import {
  packFeature0AnalysisResponse,
  type Feature0AnalysisResponse,
} from '../contracts/feature0AnalysisContract'
import { analyzeExamText } from '../services/llmTemplateAnalyzer'
import { extractPdfContent } from '../services/extractPdfContent'
import { simpleRuleBasedDraftSource } from '../services/simpleRuleBasedDraftSource'
import type { TemplateDraftSource } from '../services/templateDraftSource'

import { templateKoMixedPromptDraft } from '../../../../fixtures/template-inference/template-ko-mixed-prompt'
import { handleFeature0AnalysisLlm } from './feature0AnalysisLlmHandler'
import { looksLikeSolutionPdfFilename } from './pdfFilenameHeuristics'

export class Feature0PdfInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'Feature0PdfInputError'
  }
}

const mixedPromptStubSource: TemplateDraftSource = {
  getDraft() {
    return structuredClone(templateKoMixedPromptDraft)
  },
}

/**
 * PDF → text embegut → mateix pipeline stub que el JSON de text.
 * Si el nom del fitxer suggereix “solució”, el stub no assumeix plantilla neta (draft `ko` determinista).
 */
export async function handleFeature0AnalysisPdfStub(
  buffer: Buffer,
  filename: string,
): Promise<Feature0AnalysisResponse> {
  const extracted = await extractPdfContent(buffer)
  if (!extracted.ok) {
    throw new Feature0PdfInputError(extracted.error)
  }

  const source = looksLikeSolutionPdfFilename(filename)
    ? mixedPromptStubSource
    : simpleRuleBasedDraftSource

  const pipeline = await analyzeExamText({ text: extracted.text }, source)
  return packFeature0AnalysisResponse(pipeline)
}

/** PDF → text → model (sense heurística de nom de fitxer; el model veu el contingut). */
export async function handleFeature0AnalysisPdfLlm(
  buffer: Buffer,
): Promise<Feature0AnalysisResponse> {
  const extracted = await extractPdfContent(buffer)
  if (!extracted.ok) {
    throw new Feature0PdfInputError(extracted.error)
  }
  return handleFeature0AnalysisLlm({ text: extracted.text })
}
