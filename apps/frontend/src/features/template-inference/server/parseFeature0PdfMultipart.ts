import busboy from 'busboy'
import type { IncomingMessage } from 'node:http'

/** Límit per pujada (plantilla d’examen); evita cos massiu al middleware Vite. */
export const FEATURE0_PDF_UPLOAD_MAX_BYTES = 12 * 1024 * 1024

const FILE_FIELD = 'file'

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
  const ct = req.headers['content-type']
  if (typeof ct !== 'string' || !ct.toLowerCase().includes('multipart/form-data')) {
    return Promise.reject(
      new Feature0PdfMultipartError(400, 'Cal Content-Type multipart/form-data amb el PDF.'),
    )
  }

  return new Promise((resolve, reject) => {
    const bb = busboy({
      headers: req.headers,
      limits: { fileSize: FEATURE0_PDF_UPLOAD_MAX_BYTES },
    })

    const chunks: Buffer[] = []
    let filename = 'document.pdf'
    let sawFile = false
    let limitHit = false

    bb.on('file', (name, file, info) => {
      if (name !== FILE_FIELD) {
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
        reject(err)
      })
    })

    bb.on('error', (err: Error) => {
      reject(err)
    })

    bb.on('finish', () => {
      if (!sawFile) {
        reject(
          new Feature0PdfMultipartError(
            400,
            `Falta el camp multipart "${FILE_FIELD}" amb el fitxer PDF.`,
          ),
        )
        return
      }
      if (limitHit) {
        reject(
          new Feature0PdfMultipartError(
            413,
            `El PDF supera el límit de ${FEATURE0_PDF_UPLOAD_MAX_BYTES} bytes.`,
          ),
        )
        return
      }
      resolve({ buffer: Buffer.concat(chunks), filename })
    })

    req.pipe(bb)
  })
}
