import type { IncomingMessage } from 'node:http'

import type {
  QuestionAnswerExtractionDiagnostic,
  QuestionAnswerExtractionResult,
} from '../../../domain/question-answer-extraction/question_answer_extraction.schema'
import {
  DEFAULT_PDF_UPLOAD_MAX_BYTES,
  parsePdfMultipartUpload,
  PdfMultipartParseError,
} from '../../../infrastructure/http/parsePdfMultipartUpload'
import { isLikelyPdfBuffer } from '../../../shared/pdf/isLikelyPdfBuffer'
import { runQuestionAnswerExtractionFromPdf } from '../services/runQuestionAnswerExtractionFromPdf'

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
  body: { error: string }
}

export type QuestionAnswerExtractionHttpOutcome =
  | QuestionAnswerExtractionHttpOk
  | QuestionAnswerExtractionHttpErr

/**
 * Façana de consum: valida PDF mínim i executa el pipeline existent (sense OCR nou ni heurístiques).
 * Útil per tests sense HTTP multipart; el plugin Vite i l’app reutilitzen aquest mòdul.
 */
export async function executeQuestionAnswerExtractionForPdfBuffer(
  buffer: Buffer,
): Promise<QuestionAnswerExtractionHttpOutcome> {
  if (!isLikelyPdfBuffer(buffer)) {
    return {
      ok: false,
      status: 400,
      body: { error: 'El fitxer no sembla un PDF vàlid (falta capçalera %PDF).' },
    }
  }
  try {
    const { result, diagnostic } = await runQuestionAnswerExtractionFromPdf(buffer)
    return { ok: true, status: 200, body: { result, diagnostic } }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      ok: false,
      status: 500,
      body: { error: `No s’ha pogut processar el PDF: ${msg}` },
    }
  }
}

/**
 * POST multipart amb camp `file` (PDF) → mateixa façana que `executeQuestionAnswerExtractionForPdfBuffer`.
 */
export async function executeQuestionAnswerExtractionFromHttpRequest(
  req: IncomingMessage,
): Promise<QuestionAnswerExtractionHttpOutcome> {
  try {
    const { buffer } = await parsePdfMultipartUpload(req, {
      maxBytes: DEFAULT_PDF_UPLOAD_MAX_BYTES,
      fieldName: 'file',
    })
    return executeQuestionAnswerExtractionForPdfBuffer(buffer)
  } catch (e) {
    if (e instanceof PdfMultipartParseError) {
      return { ok: false, status: e.statusCode as 400 | 413, body: { error: e.message } }
    }
    const msg = e instanceof Error ? e.message : String(e)
    return {
      ok: false,
      status: 500,
      body: { error: `Error llegint la petició: ${msg}` },
    }
  }
}
