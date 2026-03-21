import { useCallback, useState } from 'react'

import { analyzeFeature0 } from '@/features/template-inference/client/feature0AnalysisClient'
import type { Feature0AnalysisResponse } from '@/features/template-inference/contracts/feature0AnalysisContract'

type Props = {
  onBack: () => void
}

/**
 * Demo tècnica (no UI de producte): exercita route + client + contracte.
 */
export function Feature0DemoPage({ onBack }: Props) {
  const [text, setText] = useState('1234567890 text de prova')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Feature0AnalysisResponse | null>(null)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await analyzeFeature0(text)
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [text])

  return (
    <main className="feature0-demo">
      <header className="feature0-demo__header">
        <button type="button" onClick={onBack} className="feature0-demo__back">
          ← Tornar
        </button>
        <h1>Feature 0 — demo (stub local)</h1>
        <p className="feature0-demo__hint">
          Route POST <code>/api/feature0/analysis</code> només en dev / <code>vite preview</code>.
          Sense model real.
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

      <button type="button" className="feature0-demo__btn" onClick={run} disabled={loading}>
        {loading ? 'Analitzant…' : 'Analitzar'}
      </button>

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
