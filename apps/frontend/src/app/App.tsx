import { useCallback, useEffect, useState } from 'react'

import { QaeDemoPage } from '@/features/question-answer-extraction/ui/QaeDemoPage'
import { Feature0DemoPage } from '@/features/template-inference/ui/Feature0DemoPage'
import { TemplateDebugPage } from '@/features/template-debug/ui/TemplateDebugPage'

/**
 * Capa d’aplicació: composició de la UI i wiring.
 * La lògica de negoci viu a domain/features/infrastructure.
 */
export function App() {
  const [path, setPath] = useState(() => globalThis.location.pathname)

  useEffect(() => {
    const sync = () => setPath(globalThis.location.pathname)
    globalThis.addEventListener('popstate', sync)
    return () => globalThis.removeEventListener('popstate', sync)
  }, [])

  const navigate = useCallback((to: string) => {
    globalThis.history.pushState({}, '', to)
    setPath(to)
  }, [])

  if (path === '/demo/feature0') {
    return <Feature0DemoPage onBack={() => navigate('/')} />
  }

  if (path === '/demo/qae') {
    return <QaeDemoPage onBack={() => navigate('/')} />
  }

  if (path === '/debug/template') {
    return <TemplateDebugPage onBack={() => navigate('/')} />
  }

  return (
    <main className="app-shell">
      <h1>Laboratori Profes</h1>
      <p>Frontend canònic (foundations).</p>
      <p>
        <button
          type="button"
          className="app-shell__linkbtn"
          onClick={() => navigate('/demo/feature0')}
        >
          Demo Feature 0 (template-inference, stub local)
        </button>
      </p>
      <p>
        <button type="button" className="app-shell__linkbtn" onClick={() => navigate('/demo/qae')}>
          Demo QAE (question-answer-extraction, servidor Node local)
        </button>
      </p>
      <p>
        <button
          type="button"
          className="app-shell__linkbtn"
          onClick={() => navigate('/debug/template')}
        >
          Template Debug (pipeline inspector intern)
        </button>
      </p>
    </main>
  )
}
