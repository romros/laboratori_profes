/**
 * Servidor HTTP mínim (només desenvolupament): POST multipart camp `file` (PDF).
 * Per què no dins el middleware Vite: el pipeline QAE arrossega `@/domain` + OCR; el bundle del
 * `vite.config` no resol l’alias i trencaria `vite build`.
 *
 * Ús: npm run dev:qae-api
 * Prova: curl -s -X POST -F "file=@../../data/ex_alumne1.pdf" http://127.0.0.1:8787/api/question-answer-extraction
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

import { executeQuestionAnswerExtractionFromHttpRequest } from '../src/features/question-answer-extraction/server/questionAnswerExtractionHttpRoute'

const PORT = Number(process.env.QAE_API_PORT ?? '8787')
const PATH = '/api/question-answer-extraction'

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.statusCode = status
  res.end(JSON.stringify(payload))
}

createServer((req, res) => {
  const url = req.url?.split('?')[0] ?? ''
  if (url !== PATH) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('QAE API: només POST /api/question-answer-extraction (multipart file=PDF)')
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
      sendJson(res, 500, { error: 'Error intern question-answer-extraction' })
    }
  })()
}).listen(PORT, '127.0.0.1', () => {
  console.error(`QAE API escoltant http://127.0.0.1:${PORT}${PATH}`)
})
