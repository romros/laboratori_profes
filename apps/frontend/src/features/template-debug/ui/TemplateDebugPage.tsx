import { useCallback, useState } from 'react'

import { getQaeApiUrlForBrowser } from '@/features/question-answer-extraction/dev/qaeDevBrowserApiUrl'
import type { TemplateDebugResult } from '../server/templateDebugHttpRoute'

const TEMPLATE_DEBUG_PATH = '/api/template-debug'

type Props = {
  onBack: () => void
}

type Phase = 'idle' | 'loading' | 'success' | 'error'

function getDebugApiUrl(): string {
  // Mateixa base URL que QAE (nginx proxy o dev local), canviant el path
  const base = getQaeApiUrlForBrowser().replace(/\/api\/[^/]+$/, '')
  return `${base}${TEMPLATE_DEBUG_PATH}`
}

function VerificationBlock({ v }: { v: TemplateDebugResult['verification'] }) {
  const color = v.is_match ? '#1a7a1a' : '#a00'
  return (
    <div
      style={{
        border: `2px solid ${color}`,
        borderRadius: 6,
        padding: '12px 16px',
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, color }}>
        {v.is_match ? '✅ MATCH' : '❌ NO MATCH'} — {v.reason}
      </div>
      <div style={{ marginTop: 6, color: '#444', fontSize: 13 }}>
        <span>
          Confiança: <strong>{v.confidence}</strong>
        </span>
        {' · '}
        <span>
          Anchors:{' '}
          <strong>
            {v.detected_anchor_count}/{v.expected_question_count}
          </strong>
        </span>
        {v.missing_question_ids.length > 0 && (
          <span style={{ color: '#a00' }}>
            {' '}
            · No detectades: {v.missing_question_ids.join(', ')}
          </span>
        )}
      </div>
    </div>
  )
}

function AnchorRow({ a }: { a: TemplateDebugResult['anchors'][number] }) {
  if (a.not_detected) {
    return (
      <tr style={{ background: '#fff3f3' }}>
        <td style={{ padding: '4px 8px', fontWeight: 700 }}>{a.question_id}</td>
        <td colSpan={4} style={{ padding: '4px 8px', color: '#a00' }}>
          ❌ no detectat
        </td>
      </tr>
    )
  }
  const sim = a.similarity
  const simColor = sim >= 0.8 ? '#1a7a1a' : sim >= 0.6 ? '#886600' : '#a00'
  return (
    <tr style={{ background: a.shared_anchor_warning ? '#fffbe6' : undefined }}>
      <td style={{ padding: '4px 8px', fontWeight: 700 }}>{a.question_id}</td>
      <td style={{ padding: '4px 8px' }}>pàg. {a.page_index}</td>
      <td style={{ padding: '4px 8px', color: simColor, fontWeight: 600 }}>{sim.toFixed(2)}</td>
      <td
        style={{
          padding: '4px 8px',
          fontFamily: 'monospace',
          fontSize: 12,
          maxWidth: 360,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {a.matched_text}
      </td>
      <td style={{ padding: '4px 8px' }}>
        {a.shared_anchor_warning && (
          <span title="Anchor compartit amb altra pregunta" style={{ color: '#b86000' }}>
            ⚠️ anchor compartit
          </span>
        )}
      </td>
    </tr>
  )
}

function ZoneCard({ z }: { z: TemplateDebugResult['zones'][number] }) {
  const [open, setOpen] = useState(false)
  const lineCount = z.zone_text.split('\n').length
  const tooLong = lineCount > 30

  const rangeStr =
    z.start_page_index === z.end_page_index
      ? `p${z.start_page_index}  L${z.start_line_index}–${z.end_line_index}`
      : `p${z.start_page_index}:L${z.start_line_index} → p${z.end_page_index}:L${z.end_line_index}`

  return (
    <div
      style={{
        border: '1px solid #ccc',
        borderRadius: 5,
        marginBottom: 8,
        background: z.shared_anchor_warning ? '#fffbe6' : '#fafafa',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          userSelect: 'none',
        }}
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setOpen((v) => !v)
        }}
      >
        <span style={{ fontWeight: 700, minWidth: 32 }}>{z.question_id}</span>
        <span style={{ color: '#666', fontSize: 12 }}>{rangeStr}</span>
        <span style={{ color: '#888', fontSize: 12 }}>sim={z.anchor_similarity.toFixed(2)}</span>
        {z.shared_anchor_warning && (
          <span style={{ color: '#b86000', fontSize: 12 }}>⚠️ anchor compartit</span>
        )}
        {tooLong && (
          <span style={{ color: '#888', fontSize: 12 }}>⚠️ rang llarg ({lineCount} línies)</span>
        )}
        <span style={{ marginLeft: 'auto', color: '#888' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <pre
          style={{
            margin: 0,
            padding: '8px 12px',
            borderTop: '1px solid #ddd',
            fontFamily: 'monospace',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: '#f5f5f5',
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          {z.zone_text || '(buit)'}
        </pre>
      )}
    </div>
  )
}

/**
 * Debugger visual intern del pipeline template → anchors → zones.
 * No és UI de producte. Ajuda a validar si els rangs derivats són correctes.
 */
export function TemplateDebugPage({ onBack }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TemplateDebugResult | null>(null)

  const apiUrl = getDebugApiUrl()

  const run = useCallback(async () => {
    if (!file) {
      setError('Selecciona un PDF.')
      setPhase('error')
      return
    }
    setPhase('loading')
    setError(null)
    setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch(apiUrl, { method: 'POST', body: fd })
      const json = (await res.json()) as {
        result?: TemplateDebugResult
        error?: { code: string; message: string }
      }
      if (!res.ok || !json.result) {
        setError(json.error ? `[${json.error.code}] ${json.error.message}` : `HTTP ${res.status}`)
        setPhase('error')
        return
      }
      setResult(json.result)
      setPhase('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setPhase('error')
    }
  }, [apiUrl, file])

  return (
    <div
      style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto', padding: 24 }}
    >
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={onBack} style={{ cursor: 'pointer' }}>
          ← Tornar
        </button>
        <h1 style={{ margin: 0, fontSize: 20 }}>Template Debug — Pipeline Inspector</h1>
        <span style={{ color: '#888', fontSize: 12 }}>(debugger intern, no producte)</span>
      </div>

      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file && (
          <span style={{ color: '#444', fontSize: 13 }}>
            {file.name} ({Math.round(file.size / 1024)} KiB)
          </span>
        )}
        <button
          type="button"
          disabled={phase === 'loading' || !file}
          onClick={() => void run()}
          style={{
            padding: '6px 16px',
            cursor: phase === 'loading' ? 'wait' : 'pointer',
            background: '#0070c0',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
          }}
        >
          {phase === 'loading' ? 'Processant…' : 'Analitzar PDF'}
        </button>
      </div>

      {phase === 'error' && error && (
        <div
          style={{
            background: '#fff0f0',
            border: '1px solid #f00',
            borderRadius: 4,
            padding: '10px 14px',
            marginBottom: 16,
            color: '#a00',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {phase === 'success' && result && (
        <>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
            Template: <em>{result.template_source}</em> · Pàgines OCR:{' '}
            {result.ocr_pages.map((p) => `p${p.pageIndex}(${p.lineCount}L)`).join(', ')}
          </div>

          <VerificationBlock v={result.verification} />

          <h2 style={{ fontSize: 15, marginBottom: 8 }}>
            Anchors detectats ({result.anchors.filter((a) => !a.not_detected).length}/
            {result.anchors.length})
          </h2>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}
          >
            <thead>
              <tr style={{ background: '#f0f0f0', textAlign: 'left' }}>
                <th style={{ padding: '4px 8px' }}>ID</th>
                <th style={{ padding: '4px 8px' }}>Pàgina</th>
                <th style={{ padding: '4px 8px' }}>Sim.</th>
                <th style={{ padding: '4px 8px' }}>Text OCR</th>
                <th style={{ padding: '4px 8px' }}>Avís</th>
              </tr>
            </thead>
            <tbody>
              {result.anchors.map((a) => (
                <AnchorRow key={a.question_id} a={a} />
              ))}
            </tbody>
          </table>

          <h2 style={{ fontSize: 15, marginBottom: 8 }}>
            Rangs de resposta ({result.zones.length} zones)
          </h2>
          <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
            Clica una pregunta per veure el text del rang.
          </p>
          {result.zones.map((z) => (
            <ZoneCard key={z.question_id} z={z} />
          ))}

          {result.verification.missing_question_ids.length > 0 && (
            <div style={{ marginTop: 12, color: '#888', fontSize: 13 }}>
              Sense zona: {result.verification.missing_question_ids.join(', ')} (anchor no detectat)
            </div>
          )}
        </>
      )}
    </div>
  )
}
