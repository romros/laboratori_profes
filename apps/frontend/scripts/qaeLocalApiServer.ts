/**
 * Servidor HTTP mínim (només desenvolupament): POST multipart camp `file` (PDF).
 * Per què no dins el middleware Vite: el pipeline QAE arrossega `@/domain` + OCR; el bundle del
 * `vite.config` no resol l’alias i trencaria `vite build`.
 *
 * Ús: npm run dev:qae-api
 * Errors: cos JSON `{ "error": { "code", "message" } }` amb 400 / 413 / 500 segons cas.
 * CORS: respostes a `/api/question-answer-extraction` inclouen capçaleres per `fetch` des del Vite dev (localhost / 127.0.0.1).
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
import { executeTemplateDebugFromHttpRequest } from '../src/features/template-debug/server/templateDebugHttpRoute'
import { executeAssessmentSpecBuildFromJsonBody } from '../src/features/assessment-spec-builder/server/assessmentSpecHttpRoute'
import { executeGradeExamFromHttpRequest } from '../src/features/grading/server/gradingHttpRoute'

const TEMPLATE_DEBUG_API_PATH = '/api/template-debug'
const ASSESSMENT_SPEC_API_PATH = '/api/assessment-spec/build'
const GRADE_EXAM_API_PATH = '/api/grade-exam'

const host = process.env[QAE_DEV_HOST_ENV] ?? QAE_DEV_DEFAULT_HOST
const port = Number(process.env[QAE_API_PORT_ENV] ?? String(QAE_DEV_DEFAULT_PORT))

function setCors(req: IncomingMessage, res: ServerResponse): void {
  const origin = req.headers.origin
  if (
    typeof origin === 'string' &&
    /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  // multipart/form-data + preflight: cal permetre més que només `Content-Type` literal
  res.setHeader('Access-Control-Allow-Headers', '*')
}

function sendJson(
  req: IncomingMessage,
  res: ServerResponse,
  status: number,
  payload: unknown,
): void {
  setCors(req, res)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.statusCode = status
  res.end(JSON.stringify(payload))
}

createServer((req, res) => {
  const url = req.url?.split('?')[0] ?? ''

  if (req.method === 'OPTIONS') {
    setCors(req, res)
    res.statusCode = 204
    res.end()
    return
  }

  if (url === QAE_API_PATH) {
    if (req.method !== 'POST') {
      setCors(req, res)
      res.statusCode = 405
      res.setHeader('Allow', 'POST, OPTIONS')
      res.end()
      return
    }
    void (async () => {
      try {
        const out = await executeQuestionAnswerExtractionFromHttpRequest(req as IncomingMessage)
        sendJson(req, res, out.ok ? 200 : out.status, out.body)
      } catch {
        sendJson(req, res, 500, {
          error: {
            code: QAE_HTTP_ERROR_CODES.INTERNAL_ERROR,
            message: 'Error intern no capturat a question-answer-extraction.',
          },
        })
      }
    })()
    return
  }

  if (url === TEMPLATE_DEBUG_API_PATH) {
    if (req.method !== 'POST') {
      setCors(req, res)
      res.statusCode = 405
      res.setHeader('Allow', 'POST, OPTIONS')
      res.end()
      return
    }
    void (async () => {
      try {
        const out = await executeTemplateDebugFromHttpRequest(req as IncomingMessage)
        sendJson(req, res, out.ok ? 200 : out.status, out.body)
      } catch {
        sendJson(req, res, 500, {
          error: { code: 'internal_error', message: 'Error intern no capturat a template-debug.' },
        })
      }
    })()
    return
  }

  if (url === ASSESSMENT_SPEC_API_PATH) {
    if (req.method !== 'POST') {
      setCors(req, res)
      res.statusCode = 405
      res.setHeader('Allow', 'POST, OPTIONS')
      res.end()
      return
    }
    let body = ''
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      void (async () => {
        try {
          const out = await executeAssessmentSpecBuildFromJsonBody(body)
          sendJson(req, res, out.status, out.body)
        } catch {
          sendJson(req, res, 500, {
            error: {
              code: 'internal_error',
              message: 'Error intern no capturat a assessment-spec-builder.',
            },
          })
        }
      })()
    })
    return
  }

  if (url === GRADE_EXAM_API_PATH) {
    if (req.method !== 'POST') {
      setCors(req, res)
      res.statusCode = 405
      res.setHeader('Allow', 'POST, OPTIONS')
      res.end()
      return
    }
    void (async () => {
      try {
        const out = await executeGradeExamFromHttpRequest(req as IncomingMessage)
        sendJson(req, res, out.ok ? 200 : out.status, out.body)
      } catch {
        sendJson(req, res, 500, {
          error: { code: 'internal_error', message: 'Error intern no capturat a grade-exam.' },
        })
      }
    })()
    return
  }

  res.statusCode = 404
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end(
    `QAE API: POST ${QAE_API_PATH} | POST ${TEMPLATE_DEBUG_API_PATH} | POST ${ASSESSMENT_SPEC_API_PATH} | POST ${GRADE_EXAM_API_PATH}`,
  )
}).listen(port, host, () => {
  console.error(`QAE API escoltant ${buildQaeDevServerListenUrl(host, port)}`)
})
