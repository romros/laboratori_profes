import type { IncomingMessage } from 'node:http'

import type {
  QuestionAnswerExtractionDiagnostic,
  QuestionAnswerExtractionResult,
} from '../../../domain/question-answer-extraction/question_answer_extraction.schema'
import {
  DEFAULT_PDF_UPLOAD_MAX_BYTES,
  type PdfMultipartErrorCode,
  parsePdfMultipartUpload,
  PdfMultipartParseError,
} from '../../../infrastructure/http/parsePdfMultipartUpload'
import { isLikelyPdfBuffer } from '../../../shared/pdf/isLikelyPdfBuffer'
import { runQuestionAnswerExtractionFromPdf } from '../services/runQuestionAnswerExtractionFromPdf'

/**
 * Codis d’error HTTP de l’API QAE local (mínims, estables per consumidor).
 * No formen part del domini `QuestionAnswerExtractionResult`.
 */
export const QAE_HTTP_ERROR_CODES = {
  INVALID_MULTIPART: 'invalid_multipart',
  MISSING_FILE: 'missing_file',
  PAYLOAD_TOO_LARGE: 'payload_too_large',
  INVALID_PDF: 'invalid_pdf',
  PROCESSING_FAILED: 'processing_failed',
  INTERNAL_ERROR: 'internal_error',
} as const

export type QaeHttpErrorCode = (typeof QAE_HTTP_ERROR_CODES)[keyof typeof QAE_HTTP_ERROR_CODES]

export type QaeHttpErrorPayload = {
  error: {
    code: QaeHttpErrorCode
    message: string
  }
}

/**
 * Cos JSON d’èxit: **`result`** és el contracte canònic de domini; **`diagnostic`** és suport
 * tècnic / desenvolupament (no forma part del contracte de producte definitiu; pot limitar-se en el futur).
 */
export type QuestionAnswerExtractionHttpSuccessBody = {
  result: QuestionAnswerExtractionResult
  diagnostic: QuestionAnswerExtractionDiagnostic
}

export type QuestionAnswerExtractionHttpOk = {
  ok: true
  status: 200
  body: QuestionAnswerExtractionHttpSuccessBody
}

export type QuestionAnswerExtractionHttpErr = {
  ok: false
  status: 400 | 413 | 500
  body: QaeHttpErrorPayload
}

export type QuestionAnswerExtractionHttpOutcome =
  | QuestionAnswerExtractionHttpOk
  | QuestionAnswerExtractionHttpErr

function qaeErr(
  status: 400 | 413 | 500,
  code: QaeHttpErrorCode,
  message: string,
): QuestionAnswerExtractionHttpErr {
  return { ok: false, status, body: { error: { code, message } } }
}

function mapMultipartToQae(e: PdfMultipartParseError): QuestionAnswerExtractionHttpErr {
  const codeMap: Record<PdfMultipartErrorCode, QaeHttpErrorCode> = {
    invalid_multipart: QAE_HTTP_ERROR_CODES.INVALID_MULTIPART,
    missing_file: QAE_HTTP_ERROR_CODES.MISSING_FILE,
    payload_too_large: QAE_HTTP_ERROR_CODES.PAYLOAD_TOO_LARGE,
  }
  return qaeErr(e.statusCode as 400 | 413, codeMap[e.code], e.message)
}

/**
 * Façana de consum: valida PDF mínim i executa el pipeline existent (sense OCR nou ni heurístiques).
 * Útil per tests sense HTTP multipart; el servidor Node de dev reutilitza aquest mòdul.
 */
export async function executeQuestionAnswerExtractionForPdfBuffer(
  buffer: Buffer,
): Promise<QuestionAnswerExtractionHttpOutcome> {
  if (!isLikelyPdfBuffer(buffer)) {
    return qaeErr(
      400,
      QAE_HTTP_ERROR_CODES.INVALID_PDF,
      'El fitxer no sembla un PDF vàlid (falta seqüència %PDF als primers bytes).',
    )
  }
  try {
    const { result, diagnostic } = await runQuestionAnswerExtractionFromPdf(buffer)
    return { ok: true, status: 200, body: { result, diagnostic } }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return qaeErr(
      500,
      QAE_HTTP_ERROR_CODES.PROCESSING_FAILED,
      `No s’ha pogut processar el PDF: ${msg}`,
    )
  }
}

export type QuestionAnswerExtractionHttpRequestOptions = {
  /** Només per tests o entorns controlats; per defecte `DEFAULT_PDF_UPLOAD_MAX_BYTES`. */
  maxUploadBytes?: number
}

/**
 * POST multipart amb camp `file` (PDF) → mateixa façana que `executeQuestionAnswerExtractionForPdfBuffer`.
 */
export async function executeQuestionAnswerExtractionFromHttpRequest(
  req: IncomingMessage,
  options?: QuestionAnswerExtractionHttpRequestOptions,
): Promise<QuestionAnswerExtractionHttpOutcome> {
  try {
    const { buffer } = await parsePdfMultipartUpload(req, {
      maxBytes: options?.maxUploadBytes ?? DEFAULT_PDF_UPLOAD_MAX_BYTES,
      fieldName: 'file',
    })
    return executeQuestionAnswerExtractionForPdfBuffer(buffer)
  } catch (e) {
    if (e instanceof PdfMultipartParseError) {
      return mapMultipartToQae(e)
    }
    const msg = e instanceof Error ? e.message : String(e)
    return qaeErr(500, QAE_HTTP_ERROR_CODES.INTERNAL_ERROR, `Error llegint la petició: ${msg}`)
  }
}
