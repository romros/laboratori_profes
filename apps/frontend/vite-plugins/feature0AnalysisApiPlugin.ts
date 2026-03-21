import type { Connect, Plugin } from 'vite'

import { executeFeature0AnalysisFromJsonBody } from '../src/features/template-inference/server/feature0AnalysisHttpRoute'

const PATH = '/api/feature0/analysis'

function feature0AnalysisMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = req.url?.split('?')[0]
    if (url !== PATH) {
      next()
      return
    }
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Allow', 'POST')
      res.end()
      return
    }
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      void (async () => {
        try {
          const raw = Buffer.concat(chunks).toString('utf8')
          const out = await executeFeature0AnalysisFromJsonBody(raw)
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.statusCode = out.ok ? 200 : out.status
          res.end(JSON.stringify(out.ok ? out.body : out.body))
        } catch {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'Error intern del stub' }))
        }
      })()
    })
  }
}

/** POST local alineat amb `Feature0AnalysisResponse` (només dev / `vite preview`, sense backend extern). */
export function feature0AnalysisApiPlugin(): Plugin {
  const mw = feature0AnalysisMiddleware()
  return {
    name: 'feature0-analysis-api-stub',
    configureServer(server) {
      server.middlewares.use(mw)
    },
    configurePreviewServer(server) {
      server.middlewares.use(mw)
    },
  }
}
