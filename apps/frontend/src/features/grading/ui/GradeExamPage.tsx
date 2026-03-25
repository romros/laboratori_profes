import { useCallback, useState } from 'react'

import { getQaeApiUrlForBrowser } from '@/features/question-answer-extraction/dev/qaeDevBrowserApiUrl'
import type { GradeExamFromPdfResult } from '../gradeExamFromPdf'

const GRADE_EXAM_API_PATH = '/api/grade-exam'

type Phase =
  | 'idle'
  | 'uploading'
  | 'ocr'
  | 'mapping'
  | 'grading'
  | 'done'
  | 'done_mapping_only'
  | 'error'

type Props = {
  onBack?: () => void
}

function getApiUrl(): string {
  const base = getQaeApiUrlForBrowser().replace(/\/api\/[^/]+$/, '')
  return `${base}${GRADE_EXAM_API_PATH}`
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function PhaseBar({ phase }: { phase: Phase }) {
  const steps: { key: Phase | string; label: string }[] = [
    { key: 'uploading', label: 'Pujant PDF' },
    { key: 'ocr', label: 'OCR (PaddleVL)' },
    { key: 'mapping', label: 'Mapping' },
    { key: 'grading', label: 'Correcció (LLM)' },
  ]

  if (phase === 'idle' || phase === 'error') return null

  const activeIdx = steps.findIndex((s) => s.key === phase)
  const isDone = phase === 'done' || phase === 'done_mapping_only'

  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        margin: '16px 0',
        fontSize: 13,
        border: '1px solid #ddd',
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      {steps.map((step, i) => {
        const isActive = !isDone && step.key === phase
        const isPast = isDone || i < activeIdx
        const bg = isPast ? '#e6f4ea' : isActive ? '#fff3cd' : '#f5f5f5'
        const color = isPast ? '#1a7a1a' : isActive ? '#856404' : '#999'
        return (
          <div
            key={step.key}
            style={{
              flex: 1,
              padding: '8px 4px',
              textAlign: 'center',
              background: bg,
              color,
              fontWeight: isActive ? 700 : 'normal',
              borderRight: i < steps.length - 1 ? '1px solid #ddd' : 'none',
            }}
          >
            {isPast ? '✓ ' : isActive ? '⏳ ' : ''}
            {step.label}
          </div>
        )
      })}
    </div>
  )
}

function QuestionResult({
  q,
  answer,
}: {
  q: NonNullable<GradeExamFromPdfResult['grading']>['question_results'][number]
  answer?: { answer_text: string; ocr_status: string }
}) {
  const [open, setOpen] = useState(false)

  const verdictColor =
    q.verdict === 'correct' ? '#1a7a1a' : q.verdict === 'partial' ? '#856404' : '#a00'
  const verdictIcon = q.verdict === 'correct' ? '✅' : q.verdict === 'partial' ? '⚠️' : '❌'
  const notEvaluated = q.verdict === null

  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: 5,
        marginBottom: 8,
        background: notEvaluated ? '#fafafa' : '#fff',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          cursor: notEvaluated ? 'default' : 'pointer',
          userSelect: 'none',
        }}
        onClick={() => !notEvaluated && setOpen((v) => !v)}
        role={notEvaluated ? undefined : 'button'}
        tabIndex={notEvaluated ? undefined : 0}
        onKeyDown={(e) => {
          if (!notEvaluated && (e.key === 'Enter' || e.key === ' ')) setOpen((v) => !v)
        }}
      >
        <span style={{ fontWeight: 700, minWidth: 36 }}>{q.question_id}</span>
        {notEvaluated ? (
          <span style={{ color: '#999', fontSize: 13 }}>
            — no avaluat ({q.evaluability_reason.slice(0, 60)})
          </span>
        ) : (
          <>
            <span style={{ color: verdictColor, fontWeight: 700, fontSize: 14 }}>
              {verdictIcon} {q.verdict}
            </span>
            <span style={{ color: '#888', fontSize: 12 }}>conf={q.confidence?.toFixed(2)}</span>
            {answer && <span style={{ color: '#aaa', fontSize: 11 }}>ocr={answer.ocr_status}</span>}
            <span style={{ marginLeft: 'auto', color: '#888' }}>{open ? '▲' : '▼'}</span>
          </>
        )}
      </div>
      {open && !notEvaluated && (
        <div style={{ borderTop: '1px solid #eee', padding: '8px 12px', fontSize: 13 }}>
          {q.feedback && (
            <div style={{ marginBottom: 8, color: '#333', lineHeight: 1.5 }}>{q.feedback}</div>
          )}
          {answer?.answer_text && (
            <pre
              style={{
                margin: 0,
                padding: '6px 10px',
                background: '#f5f5f5',
                borderRadius: 4,
                fontFamily: 'monospace',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {answer.answer_text}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

function MappingOnlyResult({ result }: { result: GradeExamFromPdfResult }) {
  const detected = result.mapping.questions.filter((q) => q.is_detected)
  return (
    <div>
      <div
        style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: 5,
          padding: '10px 14px',
          marginBottom: 16,
          color: '#856404',
        }}
      >
        <strong>Mode mapping-only</strong> — grading no disponible (sense API key al servidor).
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>{result.mapping.is_match ? '✅ MATCH' : '❌ NO MATCH'}</strong>
        {' · '}confiança: <strong>{result.mapping.confidence.toFixed(2)}</strong>
        {' · '}detectades:{' '}
        <strong>
          {detected.length}/{result.mapping.questions.length}
        </strong>
      </div>
      {result.mapping.questions.map((q) => (
        <div
          key={q.question_id}
          style={{
            border: '1px solid #ddd',
            borderRadius: 4,
            marginBottom: 6,
            padding: '6px 10px',
            fontSize: 13,
          }}
        >
          <strong>{q.question_id}</strong>
          {q.is_detected ? (
            <span style={{ color: '#444', marginLeft: 8 }}>
              sim={q.match.similarity.toFixed(2)} ·{' '}
              {q.answer_text_clean.split('\n')[0]?.slice(0, 80) ?? ''}
            </span>
          ) : (
            <span style={{ color: '#a00', marginLeft: 8 }}>no detectada</span>
          )}
        </div>
      ))}
    </div>
  )
}

function GradingResult({ result }: { result: GradeExamFromPdfResult }) {
  if (result.mapping_only || !result.grading) {
    return <MappingOnlyResult result={result} />
  }

  const { grading, mapping } = result
  const graded = grading.question_results.filter((q) => q.verdict !== null)
  const correct = graded.filter((q) => q.verdict === 'correct').length
  const partial = graded.filter((q) => q.verdict === 'partial').length
  const incorrect = graded.filter((q) => q.verdict === 'incorrect').length

  // Mapa de respostes OCR per question_id
  const answerMap = new Map(
    mapping.questions.map((q) => [
      q.question_id,
      {
        answer_text: q.answer_text_clean,
        ocr_status: q.warnings.includes('low_similarity')
          ? 'uncertain'
          : q.is_detected
            ? 'ok'
            : 'not_detected',
      },
    ]),
  )

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: '✅ Correctes', val: correct, color: '#1a7a1a' },
          { label: '⚠️ Parcials', val: partial, color: '#856404' },
          { label: '❌ Incorrectes', val: incorrect, color: '#a00' },
          {
            label: 'No avaluades',
            val: grading.question_results.length - graded.length,
            color: '#999',
          },
        ].map(({ label, val, color }) => (
          <div
            key={label}
            style={{
              flex: '1 1 120px',
              border: '1px solid #eee',
              borderRadius: 6,
              padding: '10px 14px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
          </div>
        ))}
      </div>

      <div>
        {grading.question_results.map((qr) => (
          <QuestionResult key={qr.question_id} q={qr} answer={answerMap.get(qr.question_id)} />
        ))}
      </div>

      <div style={{ marginTop: 12, color: '#888', fontSize: 12 }}>
        Temps total: {(result.timing.total_ms / 1000).toFixed(1)}s · OCR:{' '}
        {(result.timing.ocr_ms / 1000).toFixed(1)}s · Grading:{' '}
        {(result.timing.grading_ms / 1000).toFixed(1)}s
      </div>
    </div>
  )
}

// ─── Pàgina principal ─────────────────────────────────────────────────────────

/**
 * Flux professor MVP: upload PDF → correcció → resultat.
 * Crida /api/grade-exam (qaeLocalApiServer / nginx proxy).
 */
export function GradeExamPage({ onBack }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GradeExamFromPdfResult | null>(null)

  const apiUrl = getApiUrl()

  const run = useCallback(async () => {
    if (!file) {
      setError('Selecciona un PDF.')
      setPhase('error')
      return
    }
    setPhase('uploading')
    setError(null)
    setResult(null)

    const fd = new FormData()
    fd.append('file', file)

    try {
      // El procés és llarg (~90s). Simulem les fases amb timeouts mentre esperem la resposta.
      setPhase('ocr')
      const ocrTimer = setTimeout(() => setPhase('mapping'), 80_000)
      const mappingTimer = setTimeout(() => setPhase('grading'), 82_000)

      const res = await fetch(apiUrl, { method: 'POST', body: fd })
      clearTimeout(ocrTimer)
      clearTimeout(mappingTimer)

      const json = (await res.json()) as {
        result?: GradeExamFromPdfResult
        error?: { code: string; message: string }
      }

      if (!res.ok || !json.result) {
        setError(json.error ? `[${json.error.code}] ${json.error.message}` : `HTTP ${res.status}`)
        setPhase('error')
        return
      }

      setResult(json.result)
      setPhase(json.result.mapping_only ? 'done_mapping_only' : 'done')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setPhase('error')
    }
  }, [apiUrl, file])

  const isDone = phase === 'done' || phase === 'done_mapping_only'
  const isRunning =
    phase === 'uploading' || phase === 'ocr' || phase === 'mapping' || phase === 'grading'

  return (
    <div
      style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 860, margin: '0 auto', padding: 24 }}
    >
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        {onBack && (
          <button type="button" onClick={onBack} style={{ cursor: 'pointer' }}>
            ← Tornar
          </button>
        )}
        <h1 style={{ margin: 0, fontSize: 20 }}>Corrector d'examen — MVP</h1>
        <span style={{ color: '#888', fontSize: 12 }}>Hospital DAW · examen LDD</span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 8,
        }}
      >
        <input
          type="file"
          accept="application/pdf,.pdf"
          disabled={isRunning}
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            setPhase('idle')
            setResult(null)
            setError(null)
          }}
        />
        {file && !isRunning && (
          <span style={{ color: '#444', fontSize: 13 }}>
            {file.name} ({Math.round(file.size / 1024)} KiB)
          </span>
        )}
        <button
          type="button"
          disabled={isRunning || !file}
          onClick={() => void run()}
          style={{
            padding: '7px 20px',
            cursor: isRunning || !file ? 'not-allowed' : 'pointer',
            background: isRunning ? '#888' : '#0070c0',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontWeight: 600,
          }}
        >
          {isRunning ? 'Processant…' : 'Corregir examen'}
        </button>
      </div>

      {isRunning && (
        <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
          ⏳ Procés llarg (~90s en CPU). No tanquis la pàgina.
        </div>
      )}

      <PhaseBar phase={phase} />

      {phase === 'error' && error && (
        <div
          style={{
            background: '#fff0f0',
            border: '1px solid #f00',
            borderRadius: 4,
            padding: '10px 14px',
            color: '#a00',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {isDone && result && (
        <>
          <h2 style={{ fontSize: 16, marginTop: 20, marginBottom: 12 }}>Resultat de correcció</h2>
          <GradingResult result={result} />
        </>
      )}
    </div>
  )
}
