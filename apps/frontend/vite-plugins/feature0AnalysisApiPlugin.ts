import type { IncomingMessage, ServerResponse } from 'node:http'

import type { Connect, Plugin } from 'vite'

import { executeFeature0AnalysisFromJsonBody } from '../src/features/template-inference/server/feature0AnalysisHttpRoute'
import { executeFeature0AnalysisLlmFromJsonBody } from '../src/features/template-inference/server/feature0AnalysisLlmHttpRoute'
import {
  executeFeature0AnalysisPdfLlmFromRequest,
  executeFeature0AnalysisPdfStubFromRequest,
} from '../src/features/template-inference/server/feature0AnalysisPdfHttpRoute'

const PATH_STUB = '/api/feature0/analysis'
const PATH_LLM = '/api/feature0/analysis/llm'
const PATH_PDF_STUB = '/api/feature0/analysis/pdf'
const PATH_PDF_LLM = '/api/feature0/analysis/pdf/llm'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.statusCode = status
  res.end(JSON.stringify(payload))
}

function feature0AnalysisMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = req.url?.split('?')[0]
    if (url !== PATH_STUB && url !== PATH_LLM && url !== PATH_PDF_STUB && url !== PATH_PDF_LLM) {
      next()
      return
    }
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Allow', 'POST')
      res.end()
      return
    }

    if (url === PATH_PDF_STUB || url === PATH_PDF_LLM) {
      void (async () => {
        try {
          const outPdf =
            url === PATH_PDF_STUB
              ? await executeFeature0AnalysisPdfStubFromRequest(req)
              : await executeFeature0AnalysisPdfLlmFromRequest(req)
          sendJson(res, outPdf.ok ? 200 : outPdf.status, outPdf.ok ? outPdf.body : outPdf.body)
        } catch {
          sendJson(res, 500, { error: 'Error intern del servidor Feature 0' })
        }
      })()
      return
    }

    void (async () => {
      try {
        const raw = await readBody(req)
        if (url === PATH_STUB) {
          const out = await executeFeature0AnalysisFromJsonBody(raw)
          sendJson(res, out.ok ? 200 : out.status, out.ok ? out.body : out.body)
          return
        }
        const outLlm = await executeFeature0AnalysisLlmFromJsonBody(raw)
        sendJson(res, outLlm.ok ? 200 : outLlm.status, outLlm.ok ? outLlm.body : outLlm.body)
      } catch {
        sendJson(res, 500, { error: 'Error intern del servidor Feature 0' })
      }
    })()
  }
}

/** POST locals: stub / LLM text JSON + mateix pipeline amb PDF multipart (`/pdf`, `/pdf/llm`). */
export function feature0AnalysisApiPlugin(): Plugin {
  const mw = feature0AnalysisMiddleware()
  return {
    name: 'feature0-analysis-api',
    configureServer(server) {
      server.middlewares.use(mw)
    },
    configurePreviewServer(server) {
      server.middlewares.use(mw)
    },
  }
}
