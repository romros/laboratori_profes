import type { IncomingMessage } from 'node:http'
import { Readable } from 'node:stream'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
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
function fakeMultipartRequest(body: Buffer, boundary: string): IncomingMessage {
  const stream = Readable.from([body]) as unknown as IncomingMessage
  stream.headers = {
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': String(body.length),
  }
  stream.method = 'POST'
  return stream
}

describe('executeQuestionAnswerExtractionForPdfBuffer', () => {
  it('sense capçalera PDF → 400', async () => {
    const out = await executeQuestionAnswerExtractionForPdfBuffer(Buffer.from('text pla'))
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.status).toBe(400)
      expect(out.body.error).toMatch(/PDF/)
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

  it('multipart sense camp file → 400', async () => {
    const boundary = '----qaeEmpty'
    const body = Buffer.from(`--${boundary}--\r\n`)
    const req = fakeMultipartRequest(body, boundary)
    const out = await executeQuestionAnswerExtractionFromHttpRequest(req)
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.status).toBe(400)
    }
  })
})
