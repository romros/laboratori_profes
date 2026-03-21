import { useCallback, useState } from 'react'

import {
  analyzeFeature0,
  analyzeFeature0WithLlm,
} from '@/features/template-inference/client/feature0AnalysisClient'
import type { Feature0AnalysisResponse } from '@/features/template-inference/contracts/feature0AnalysisContract'

type Props = {
  onBack: () => void
}

/**
 * Demo tècnica (no UI de producte): exercita route + client + contracte.
 */
export function Feature0DemoPage({ onBack }: Props) {
  const [text, setText] = useState('1234567890 text de prova')
  const [loading, setLoading] = useState<'stub' | 'llm' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Feature0AnalysisResponse | null>(null)

  const runStub = useCallback(async () => {
    setLoading('stub')
    setError(null)
    setResult(null)
    try {
      const res = await analyzeFeature0(text)
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(null)
    }
  }, [text])

  const runLlm = useCallback(async () => {
    setLoading('llm')
    setError(null)
    setResult(null)
    try {
      const res = await analyzeFeature0WithLlm(text)
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(null)
    }
  }, [text])

  return (
    <main className="feature0-demo">
      <header className="feature0-demo__header">
        <button type="button" onClick={onBack} className="feature0-demo__back">
          ← Tornar
        </button>
        <h1>Feature 0 — demo</h1>
        <p className="feature0-demo__hint">
          <code>/api/feature0/analysis</code> stub determinista ·{' '}
          <code>/api/feature0/analysis/llm</code> model al servidor (cal clau d’API a env). Només
          dev / <code>vite preview</code>.
        </p>
      </header>

      <label className="feature0-demo__label" htmlFor="feature0-text">
        Text d’entrada
      </label>
      <textarea
        id="feature0-text"
        className="feature0-demo__textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        spellCheck={false}
      />

      <div className="feature0-demo__actions">
        <button
          type="button"
          className="feature0-demo__btn"
          onClick={runStub}
          disabled={loading !== null}
        >
          {loading === 'stub' ? 'Analitzant…' : 'Analitzar (stub)'}
        </button>
        <button
          type="button"
          className="feature0-demo__btn feature0-demo__btn--secondary"
          onClick={runLlm}
          disabled={loading !== null}
        >
          {loading === 'llm' ? 'Model…' : 'Analitzar (model)'}
        </button>
      </div>

      {error ? (
        <p className="feature0-demo__error" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <section className="feature0-demo__result" aria-live="polite">
          <h2>Resultat (validator)</h2>
          <p>
            <strong>ok:</strong> {String(result.validated.ok)} · <strong>decisió:</strong>{' '}
            {result.validated.decision}
          </p>
          <p>
            <strong>motius:</strong> {result.validated.reasons.join(' | ')}
          </p>

          <details className="feature0-demo__details">
            <summary>Debug: rawDraft</summary>
            <pre className="feature0-demo__pre">{JSON.stringify(result.rawDraft, null, 2)}</pre>
          </details>
          <details className="feature0-demo__details">
            <summary>Debug: normalizedDraft</summary>
            <pre className="feature0-demo__pre">
              {JSON.stringify(result.normalizedDraft, null, 2)}
            </pre>
          </details>
        </section>
      ) : null}
    </main>
  )
}
