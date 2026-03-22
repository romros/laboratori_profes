import type { IncomingMessage } from 'node:http'

import {
  DEFAULT_PDF_UPLOAD_MAX_BYTES,
  parsePdfMultipartUpload,
  PdfMultipartParseError,
} from '../../../infrastructure/http/parsePdfMultipartUpload'

/** Límit per pujada (plantilla d’examen); evita cos massiu al middleware Vite. */
export const FEATURE0_PDF_UPLOAD_MAX_BYTES = DEFAULT_PDF_UPLOAD_MAX_BYTES

export class Feature0PdfMultipartError extends Error {
  readonly statusCode: number
  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'Feature0PdfMultipartError'
    this.statusCode = statusCode
  }
}

export type ParsedFeature0PdfUpload = {
  buffer: Buffer
  filename: string
}

/**
 * Llegeix un únic camp `file` (PDF) d’un POST multipart.
 */
export function parseFeature0PdfMultipart(req: IncomingMessage): Promise<ParsedFeature0PdfUpload> {
  return parsePdfMultipartUpload(req, {
    maxBytes: FEATURE0_PDF_UPLOAD_MAX_BYTES,
    fieldName: 'file',
  }).catch((e: unknown) => {
    if (e instanceof PdfMultipartParseError) {
      throw new Feature0PdfMultipartError(e.statusCode, e.message)
    }
    throw e
  })
}
