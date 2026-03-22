import { useCallback, useState, type DragEvent } from 'react'

import type {
  QuestionAnswerExtractionDiagnostic,
  QuestionAnswerExtractionResult,
} from '@/domain/question-answer-extraction/question_answer_extraction.schema'
import { getQaeApiUrlForBrowser } from '@/features/question-answer-extraction/dev/qaeDevBrowserApiUrl'

type Props = {
  onBack: () => void
}

type UiPhase = 'idle' | 'loading' | 'success' | 'error'

type QaeErrorPayload = {
  error: {
    code: string
    message: string
  }
}

function isQaeErrorPayload(x: unknown): x is QaeErrorPayload {
  if (typeof x !== 'object' || x === null) return false
  const e = (x as { error?: unknown }).error
  if (typeof e !== 'object' || e === null) return false
  return (
    typeof (e as { code?: unknown }).code === 'string' &&
    typeof (e as { message?: unknown }).message === 'string'
  )
}

/**
 * Demo dev (no UI de producte): pujada PDF → API QAE local → visualització de `result` + `diagnostic` opcional.
 */
export function QaeDemoPage({ onBack }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<UiPhase>('idle')
  const [httpStatus, setHttpStatus] = useState<number | null>(null)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  const [result, setResult] = useState<QuestionAnswerExtractionResult | null>(null)
  const [diagnostic, setDiagnostic] = useState<QuestionAnswerExtractionDiagnostic | null>(null)

  const apiUrl = getQaeApiUrlForBrowser()

  const runExtraction = useCallback(async () => {
    if (!file) {
      setPhase('error')
      setHttpStatus(null)
      setErrorDetail('Selecciona un fitxer PDF.')
      setResult(null)
      setDiagnostic(null)
      return
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPhase('error')
      setHttpStatus(null)
      setErrorDetail('El fitxer ha de ser PDF.')
      setResult(null)
      setDiagnostic(null)
      return
    }

    setPhase('loading')
    setHttpStatus(null)
    setErrorDetail(null)
    setResult(null)
    setDiagnostic(null)

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch(apiUrl, { method: 'POST', body: fd })
      setHttpStatus(res.status)
      let json: unknown
      try {
        json = await res.json()
      } catch {
        setPhase('error')
        setErrorDetail(`HTTP ${res.status}: resposta no és JSON vàlid.`)
        return
      }

      if (!res.ok) {
        setPhase('error')
        if (isQaeErrorPayload(json)) {
          setErrorDetail(`[${json.error.code}] ${json.error.message}`)
        } else {
          setErrorDetail(`Resposta d’error no reconeguda (HTTP ${res.status}).`)
        }
        return
      }

      const body = json as {
        result?: QuestionAnswerExtractionResult
        diagnostic?: QuestionAnswerExtractionDiagnostic
      }
      if (!body.result) {
        setPhase('error')
        setErrorDetail('Resposta 200 sense camp result.')
        return
      }

      setResult(body.result)
      setDiagnostic(body.diagnostic ?? null)
      setPhase('success')
    } catch (e) {
      setPhase('error')
      setHttpStatus(null)
      setErrorDetail(
        e instanceof Error
          ? `${e.message} (l’API QAE hauria de respondre via nginx proxy; si uses Vite dev local, cal \`npm run dev:qae-api\`)`
          : String(e),
      )
    }
  }, [apiUrl, file])

  const onDrop = useCallback((ev: DragEvent<HTMLDivElement>) => {
    ev.preventDefault()
    const f = ev.dataTransfer.files[0]
    if (f) setFile(f)
  }, [])

  const statusSummary =
    result === null
      ? null
      : [...new Set(result.items.map((i) => i.status))].reduce(
          (acc, s) => {
            acc[s] = result.items.filter((i) => i.status === s).length
            return acc
          },
          {} as Record<string, number>,
        )

  return (
    <div className="qae-demo">
      <header className="qae-demo__header">
        <button type="button" className="qae-demo__back" onClick={onBack}>
          ← Tornar
        </button>
        <h1>Demo QAE (question-answer-extraction)</h1>
        <p className="qae-demo__hint">
          API QAE integrada via nginx proxy. Endpoint: <code>{apiUrl}</code>{' '}
          (override: <code>VITE_QAE_API_BASE_URL</code>; Vite dev local: <code>npm run dev:qae-api</code>).
        </p>
      </header>

      <section className="qae-demo__section">
        <label className="qae-demo__label" htmlFor="qae-file">
          PDF d’examen (alumne)
        </label>
        <input
          id="qae-file"
          className="qae-demo__file"
          type="file"
          accept="application/pdf,.pdf"
          onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
        />
        <div
          className="qae-demo__drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          role="presentation"
        >
          Arrossega un PDF aquí (opcional)
        </div>
        {file ? (
          <p className="qae-demo__filename">
            Seleccionat: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KiB)
          </p>
        ) : (
          <p className="qae-demo__filename qae-demo__filename--muted">Cap fitxer seleccionat.</p>
        )}
        <button
          type="button"
          className="qae-demo__btn"
          disabled={phase === 'loading'}
          onClick={() => void runExtraction()}
        >
          {phase === 'loading' ? 'Processant…' : 'Executar extracció'}
        </button>
      </section>

      {phase === 'error' && errorDetail && (
        <div className="qae-demo__error" role="alert">
          <strong>Error</strong>
          {httpStatus != null && <span className="qae-demo__error-code"> HTTP {httpStatus}</span>}
          <div>{errorDetail}</div>
        </div>
      )}

      {phase === 'success' && result && (
        <section className="qae-demo__result">
          <h2>Resultat (contracte de producte)</h2>
          {statusSummary && (
            <p className="qae-demo__summary">
              Ítems: <strong>{result.items.length}</strong>
              {Object.entries(statusSummary).map(([s, n]) => (
                <span key={s} className="qae-demo__pill">
                  {s}: {n}
                </span>
              ))}
            </p>
          )}
          <ul className="qae-demo__items">
            {result.items.map((item) => (
              <li key={item.question_id} className="qae-demo__card">
                <div className="qae-demo__card-head">
                  <span className="qae-demo__qid">Pregunta {item.question_id}</span>
                  <span className={`qae-demo__status qae-demo__status--${item.status}`}>
                    {item.status}
                  </span>
                  <span className="qae-demo__pages">pàg.: {item.page_indices.join(', ')}</span>
                </div>
                <pre className="qae-demo__answer">{item.answer_text || '(buit)'}</pre>
              </li>
            ))}
          </ul>

          <details className="qae-demo__details">
            <summary>Diagnòstic tècnic (opcional, no és contracte de producte)</summary>
            <pre className="qae-demo__pre">{JSON.stringify(diagnostic, null, 2)}</pre>
          </details>
        </section>
      )}
    </div>
  )
}
