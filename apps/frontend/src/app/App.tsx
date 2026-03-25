import { useCallback, useEffect, useState } from 'react'

import { QaeDemoPage } from '@/features/question-answer-extraction/ui/QaeDemoPage'
import { Feature0DemoPage } from '@/features/template-inference/ui/Feature0DemoPage'
import { TemplateDebugPage } from '@/features/template-debug/ui/TemplateDebugPage'
import { GradeExamPage } from '@/features/grading/ui/GradeExamPage'

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

  // / i /demo/grade → corrector principal
  return <GradeExamPage onBack={() => navigate('/')} />
}
