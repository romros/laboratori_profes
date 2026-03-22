import type { IncomingMessage } from 'node:http'
import { Readable } from 'node:stream'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  QAE_HTTP_ERROR_CODES,
  executeQuestionAnswerExtractionForPdfBuffer,
  executeQuestionAnswerExtractionFromHttpRequest,
} from '@/features/question-answer-extraction/server/questionAnswerExtractionHttpRoute'

vi.mock(
  '@/features/question-answer-extraction/services/runQuestionAnswerExtractionFromPdf',
  () => ({
    runQuestionAnswerExtractionFromPdf: vi.fn(),
  }),
)

import { runQuestionAnswerExtractionFromPdf } from '@/features/question-answer-extraction/services/runQuestionAnswerExtractionFromPdf'

const mockedRun = vi.mocked(runQuestionAnswerExtractionFromPdf)

beforeEach(() => {
  vi.clearAllMocks()
})

function buildMultipartWithFile(pdfBytes: Buffer, boundary: string): Buffer {
  const head = Buffer.from(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="x.pdf"\r\n` +
      `Content-Type: application/pdf\r\n\r\n`,
  )
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
  return Buffer.concat([head, pdfBytes, tail])
}

/** Flux llegible amb `headers` — suficient perquè `parsePdfMultipartUpload` faci `req.pipe(busboy)`. */
function fakeRequest(body: Buffer, headers: Record<string, string | undefined>): IncomingMessage {
  const stream = Readable.from([body]) as unknown as IncomingMessage
  stream.headers = headers
  stream.method = 'POST'
  return stream
}

function fakeMultipartRequest(body: Buffer, boundary: string): IncomingMessage {
  return fakeRequest(body, {
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': String(body.length),
  })
}

describe('executeQuestionAnswerExtractionForPdfBuffer', () => {
  it('sense capçalera PDF → 400 invalid_pdf', async () => {
    const out = await executeQuestionAnswerExtractionForPdfBuffer(Buffer.from('text pla'))
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.status).toBe(400)
      expect(out.body.error.code).toBe(QAE_HTTP_ERROR_CODES.INVALID_PDF)
      expect(out.body.error.message).toMatch(/PDF/)
    }
  })

  it('PDF vàlid + pipeline → 200 amb result i diagnostic', async () => {
    mockedRun.mockResolvedValueOnce({
      result: {
        items: [
          {
            question_id: '1',
            answer_text: 'hola',
            status: 'ok',
            page_indices: [1],
          },
        ],
      },
      diagnostic: {
        page_count: 1,
        raster_target_width: 1800,
        ocr_languages: 'cat',
      },
    })
    const out = await executeQuestionAnswerExtractionForPdfBuffer(Buffer.from('%PDF-1.4\n%%EOF\n'))
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.body.result.items).toHaveLength(1)
      expect(out.body.result.items[0].question_id).toBe('1')
      expect(out.body.diagnostic.page_count).toBe(1)
    }
  })

  it('pipeline llença → 500 processing_failed', async () => {
    mockedRun.mockRejectedValueOnce(new Error('fallada simulada'))
    const out = await executeQuestionAnswerExtractionForPdfBuffer(Buffer.from('%PDF-1.4\n'))
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.status).toBe(500)
      expect(out.body.error.code).toBe(QAE_HTTP_ERROR_CODES.PROCESSING_FAILED)
      expect(out.body.error.message).toContain('fallada simulada')
    }
  })
})

describe('executeQuestionAnswerExtractionFromHttpRequest', () => {
  it('multipart amb PDF vàlid → 200 (mock pipeline)', async () => {
    mockedRun.mockResolvedValueOnce({
      result: { items: [] },
      diagnostic: {
        page_count: 0,
        raster_target_width: 1800,
        ocr_languages: 'cat',
      },
    })
    const boundary = '----qaeTestBoundary'
    const body = buildMultipartWithFile(Buffer.from('%PDF-1.4 minimal'), boundary)
    const req = fakeMultipartRequest(body, boundary)
    const out = await executeQuestionAnswerExtractionFromHttpRequest(req)
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.body.result).toBeDefined()
      expect(out.body.diagnostic).toBeDefined()
    }
  })

  it('sense Content-Type multipart → 400 invalid_multipart', async () => {
    const req = fakeRequest(Buffer.from('{}'), {
      'content-type': 'application/json',
      'content-length': '2',
    })
    const out = await executeQuestionAnswerExtractionFromHttpRequest(req)
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.status).toBe(400)
      expect(out.body.error.code).toBe(QAE_HTTP_ERROR_CODES.INVALID_MULTIPART)
    }
  })

  it('multipart sense camp file → 400 missing_file', async () => {
    const boundary = '----qaeEmpty'
    const body = Buffer.from(`--${boundary}--\r\n`)
    const req = fakeMultipartRequest(body, boundary)
    const out = await executeQuestionAnswerExtractionFromHttpRequest(req)
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.status).toBe(400)
      expect(out.body.error.code).toBe(QAE_HTTP_ERROR_CODES.MISSING_FILE)
    }
  })

  it('multipart amb cos que no és PDF → 400 invalid_pdf', async () => {
    mockedRun.mockClear()
    const boundary = '----qaeTxt'
    const body = buildMultipartWithFile(Buffer.from('no es pdf'), boundary)
    const req = fakeMultipartRequest(body, boundary)
    const out = await executeQuestionAnswerExtractionFromHttpRequest(req)
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.status).toBe(400)
      expect(out.body.error.code).toBe(QAE_HTTP_ERROR_CODES.INVALID_PDF)
    }
    expect(mockedRun).not.toHaveBeenCalled()
  })

  it('fitxer supera maxUploadBytes → 413 payload_too_large', async () => {
    const boundary = '----qaeBig'
    const big = Buffer.alloc(500, 0x41)
    const body = buildMultipartWithFile(big, boundary)
    const req = fakeMultipartRequest(body, boundary)
    const out = await executeQuestionAnswerExtractionFromHttpRequest(req, { maxUploadBytes: 80 })
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.status).toBe(413)
      expect(out.body.error.code).toBe(QAE_HTTP_ERROR_CODES.PAYLOAD_TOO_LARGE)
    }
  })
})
