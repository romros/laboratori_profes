import busboy from 'busboy'
import type { IncomingMessage } from 'node:http'

/** Límit per defecte per pujada PDF al middleware Vite (exàmens). */
export const DEFAULT_PDF_UPLOAD_MAX_BYTES = 12 * 1024 * 1024

export type PdfMultipartErrorCode = 'invalid_multipart' | 'missing_file' | 'payload_too_large'

export class PdfMultipartParseError extends Error {
  readonly statusCode: number
  readonly code: PdfMultipartErrorCode
  constructor(statusCode: number, code: PdfMultipartErrorCode, message: string) {
    super(message)
    this.name = 'PdfMultipartParseError'
    this.statusCode = statusCode
    this.code = code
  }
}

export type ParsedPdfMultipartUpload = {
  buffer: Buffer
  filename: string
}

export type ParsePdfMultipartOptions = {
  maxBytes?: number
  /** Nom del camp del formulari (per defecte `file`). */
  fieldName?: string
}

/**
 * Llegeix un únic camp multipart (per defecte `file`) amb el cos del PDF.
 * Reutilitzable per rutes locals (Feature 0, QAE, etc.).
 */
export function parsePdfMultipartUpload(
  req: IncomingMessage,
  options?: ParsePdfMultipartOptions,
): Promise<ParsedPdfMultipartUpload> {
  const maxBytes = options?.maxBytes ?? DEFAULT_PDF_UPLOAD_MAX_BYTES
  const fieldName = options?.fieldName ?? 'file'

  const ct = req.headers['content-type']
  if (typeof ct !== 'string' || !ct.toLowerCase().includes('multipart/form-data')) {
    return Promise.reject(
      new PdfMultipartParseError(
        400,
        'invalid_multipart',
        'Cal Content-Type multipart/form-data amb el PDF.',
      ),
    )
  }

  return new Promise((resolve, reject) => {
    const bb = busboy({
      headers: req.headers,
      limits: { fileSize: maxBytes },
    })

    const chunks: Buffer[] = []
    let filename = 'document.pdf'
    let sawFile = false
    let limitHit = false

    bb.on('file', (name, file, info) => {
      if (name !== fieldName) {
        file.resume()
        return
      }
      sawFile = true
      filename = info.filename?.trim() || filename

      file.on('data', (data: Buffer) => {
        chunks.push(data)
      })
      file.on('limit', () => {
        limitHit = true
        file.resume()
      })
      file.on('error', (err: Error) => {
        reject(
          new PdfMultipartParseError(
            400,
            'invalid_multipart',
            `Error llegint el fitxer multipart: ${err.message}`,
          ),
        )
      })
    })

    bb.on('error', (err: Error) => {
      reject(
        new PdfMultipartParseError(
          400,
          'invalid_multipart',
          `Multipart mal format o incomplet: ${err.message}`,
        ),
      )
    })

    bb.on('finish', () => {
      if (!sawFile) {
        reject(
          new PdfMultipartParseError(
            400,
            'missing_file',
            `Falta el camp multipart "${fieldName}" amb el fitxer PDF.`,
          ),
        )
        return
      }
      if (limitHit) {
        reject(
          new PdfMultipartParseError(
            413,
            'payload_too_large',
            `El PDF supera el límit de ${maxBytes} bytes.`,
          ),
        )
        return
      }
      resolve({ buffer: Buffer.concat(chunks), filename })
    })

    req.pipe(bb)
  })
}
