import type {
  QuestionAnswerExtractionDiagnostic,
  QuestionAnswerExtractionResult,
} from '@/domain/question-answer-extraction/question_answer_extraction.schema'

import { mapSpikeToQuestionAnswerExtraction } from './mapToQuestionAnswerExtractionResult'
import { runQuestionAnswerExtractionSpike } from './runQuestionAnswerExtractionSpike'

/**
 * Pipeline estable: PDF d’alumne → contracte de domini + diagnòstic tècnic separat.
 * El motor intern continua sent el mateix que l’spike; la sortida estable és canònica per a consumidors.
 */
export async function runQuestionAnswerExtractionFromPdf(pdfBuffer: Buffer): Promise<{
  result: QuestionAnswerExtractionResult
  diagnostic: QuestionAnswerExtractionDiagnostic
}> {
  const spike = await runQuestionAnswerExtractionSpike(pdfBuffer)
  return mapSpikeToQuestionAnswerExtraction(spike)
}
