/**
 * Servidor HTTP mínim (només desenvolupament): POST multipart camp `file` (PDF).
 * Per què no dins el middleware Vite: el pipeline QAE arrossega `@/domain` + OCR; el bundle del
 * `vite.config` no resol l’alias i trencaria `vite build`.
 *
 * Ús: npm run dev:qae-api
 * Errors: cos JSON `{ "error": { "code", "message" } }` amb 400 / 413 / 500 segons cas.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

import {
  QAE_HTTP_ERROR_CODES,
  executeQuestionAnswerExtractionFromHttpRequest,
} from '../src/features/question-answer-extraction/server/questionAnswerExtractionHttpRoute'
import {
  QAE_API_PATH,
  QAE_API_PORT_ENV,
  QAE_DEV_DEFAULT_HOST,
  QAE_DEV_DEFAULT_PORT,
  QAE_DEV_HOST_ENV,
  buildQaeDevServerListenUrl,
} from '../src/features/question-answer-extraction/dev/qaeDevServerConstants'

const host = process.env[QAE_DEV_HOST_ENV] ?? QAE_DEV_DEFAULT_HOST
const port = Number(process.env[QAE_API_PORT_ENV] ?? String(QAE_DEV_DEFAULT_PORT))

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.statusCode = status
  res.end(JSON.stringify(payload))
}

createServer((req, res) => {
  const url = req.url?.split('?')[0] ?? ''
  if (url !== QAE_API_PATH) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(`QAE API: només POST ${QAE_API_PATH} (multipart file=PDF)`)
    return
  }
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    res.end()
    return
  }

  void (async () => {
    try {
      const out = await executeQuestionAnswerExtractionFromHttpRequest(req as IncomingMessage)
      sendJson(res, out.ok ? 200 : out.status, out.body)
    } catch {
      sendJson(res, 500, {
        error: {
          code: QAE_HTTP_ERROR_CODES.INTERNAL_ERROR,
          message: 'Error intern no capturat a question-answer-extraction.',
        },
      })
    }
  })()
}).listen(port, host, () => {
  console.error(`QAE API escoltant ${buildQaeDevServerListenUrl(host, port)}`)
})
