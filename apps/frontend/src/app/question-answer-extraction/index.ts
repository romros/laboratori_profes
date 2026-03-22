/**
 * Punt d’entrada aplicatiu (reexport): la implementació viu a `features/.../server/`
 * per poder carregar-se des del middleware Vite sense alias `@/` al graf del config.
 */
export {
  executeQuestionAnswerExtractionForPdfBuffer,
  executeQuestionAnswerExtractionFromHttpRequest,
  type QuestionAnswerExtractionHttpErr,
  type QuestionAnswerExtractionHttpOk,
  type QuestionAnswerExtractionHttpOutcome,
  type QuestionAnswerExtractionHttpSuccessBody,
} from '../../features/question-answer-extraction/server/questionAnswerExtractionHttpRoute'
