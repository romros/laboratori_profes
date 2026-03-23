/**
 * Feature 2.2 — Calibratge real (cas hospital): pipeline complet amb variants comparables.
 *
 * Per defecte:
 * - V1: base `gpt-5.4-mini` → enrich `gpt-5.4` (chat/completions)
 * - V2: base `gpt-5.4-mini` → enrich `gpt-5.4-pro` (Responses API)
 *
 * Variant 3 (opcional): `CALIBRATION_ASSESSMENT_SPEC_VARIANT3=1`
 * → base `gpt-5.4` → enrich `gpt-5.4-pro`
 *
 * Clau: ASSESSMENT_SPEC_OPENAI_API_KEY | OPENAI_API_KEY | FEATURE0_OPENAI_API_KEY
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  assessmentSpecSchema,
  type AssessmentSpec,
} from '../src/domain/assessment-spec/assessmentSpec.schema'
import type { AssessmentSpecLlmTelemetry } from '../src/features/assessment-spec-builder/services/assessmentSpecModelEnv'
import { buildAssessmentSpecWithPedagogicEnrichment } from '../src/features/assessment-spec-builder/services/buildAssessmentSpecWithPedagogicEnrichment'
import {
  hospitalDawExamText,
  hospitalDawSolutionText,
} from '../tests/fixtures/assessment-spec-builder/hospitalDawGolden'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolveApiKey(): string {
  return (
    process.env.ASSESSMENT_SPEC_OPENAI_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.FEATURE0_OPENAI_API_KEY?.trim() ||
    ''
  )
}

type Variant = { id: string; baseModel: string; enrichModel: string }

const VARIANTS: Variant[] = [
  { id: 'V1', baseModel: 'gpt-5.4-mini', enrichModel: 'gpt-5.4' },
  { id: 'V2', baseModel: 'gpt-5.4-mini', enrichModel: 'gpt-5.4-pro' },
  { id: 'V3', baseModel: 'gpt-5.4', enrichModel: 'gpt-5.4-pro' },
]

function formatTelemetryRows(rounds: AssessmentSpecLlmTelemetry[]): string {
  return rounds
    .map(
      (r) =>
        `| ${r.phase} | ${r.model} | ${r.endpointKind} | ${r.latencyMs.toFixed(0)} | ${r.usage?.prompt_tokens ?? '—'} | ${r.usage?.completion_tokens ?? '—'} | ${r.usage?.total_tokens ?? '—'} |`,
    )
    .join('\n')
}

function sumTokens(
  rounds: AssessmentSpecLlmTelemetry[],
  k: keyof NonNullable<AssessmentSpecLlmTelemetry['usage']>,
): number {
  return rounds.reduce((acc, r) => acc + (r.usage?.[k] ?? 0), 0)
}

/** Mètriques heurístiques per comparar variants (no substitueixen revisió manual). */
function qualityHints(spec: AssessmentSpec): string {
  const qs = spec.questions
  if (qs.length === 0) {
    return '—'
  }
  const withReq = qs.filter((q) => q.required_elements.length > 0).length
  const withMist = qs.filter((q) => q.important_mistakes.length > 0).length
  const withNotes = qs.filter((q) => q.teacher_style_notes.length > 0).length
  const avgWhat = qs.reduce((acc, q) => acc + q.what_to_evaluate.join(' ').length, 0) / qs.length
  return `preguntes amb required_elements: ${withReq}/15; important_mistakes: ${withMist}/15; teacher_style_notes: ${withNotes}/15; mitjana chars what_to_evaluate (totes juntes): ${avgWhat.toFixed(0)}`
}

type VariantResult = {
  variant: Variant
  ok: boolean
  errMsg: string
  qCount: number
  totalMs: number
  rounds: AssessmentSpecLlmTelemetry[]
  spec?: AssessmentSpec
}

async function main(): Promise<void> {
  const apiKey = resolveApiKey()
  if (!apiKey) {
    console.error(
      'Cal clau API (ASSESSMENT_SPEC_OPENAI_API_KEY, OPENAI_API_KEY o FEATURE0_OPENAI_API_KEY).',
    )
    process.exit(1)
  }

  const runV3 = process.env.CALIBRATION_ASSESSMENT_SPEC_VARIANT3 === '1'
  const toRun = runV3 ? VARIANTS : VARIANTS.slice(0, 2)

  const results: VariantResult[] = []

  for (const v of toRun) {
    const rounds: AssessmentSpecLlmTelemetry[] = []
    const t0 = Date.now()
    let ok = false
    let errMsg = ''
    let qCount = 0
    let spec: AssessmentSpec | undefined
    try {
      spec = await buildAssessmentSpecWithPedagogicEnrichment({
        examText: hospitalDawExamText,
        solutionText: hospitalDawSolutionText,
        apiKey,
        baseUrl: process.env.ASSESSMENT_SPEC_OPENAI_BASE_URL,
        model: v.baseModel,
        enrichModel: v.enrichModel,
        onLlmRound: (t) => rounds.push(t),
      })
      assessmentSpecSchema.parse(spec)
      ok = true
      qCount = spec.questions.length
    } catch (e) {
      errMsg = e instanceof Error ? e.message : String(e)
    }
    const totalMs = Date.now() - t0
    results.push({ variant: v, ok, errMsg, qCount, totalMs, rounds, spec })
  }

  const lines: string[] = [
    '# Calibratge models — Assessment Spec (cas hospital DAW)',
    '',
    `Data execució: ${new Date().toISOString()}`,
    '',
    'Pipeline: `buildAssessmentSpec` (passada 1) + `enrichAssessmentSpec` (passada 2).',
    '',
    '**Defaults producte:** passada 1 → `gpt-5.4-mini` (`ASSESSMENT_SPEC_MODEL`); passada 2 → `gpt-5.4-pro` (`ASSESSMENT_SPEC_ENRICH_MODEL`, endpoint `POST /v1/responses`).',
    '',
    '## Telemetria per variant',
    '',
  ]

  for (const r of results) {
    const v = r.variant
    const pt = sumTokens(r.rounds, 'prompt_tokens')
    const ct = sumTokens(r.rounds, 'completion_tokens')
    const tt = sumTokens(r.rounds, 'total_tokens')
    const hasUsage = r.rounds.some((x) => x.usage != null)

    lines.push(`### ${v.id}: base \`${v.baseModel}\` → enrich \`${v.enrichModel}\``)
    lines.push('')
    lines.push(`- **Schema OK:** ${r.ok ? 'sí' : 'no'}`)
    lines.push(`- **Preguntes:** ${r.qCount}`)
    lines.push(`- **Temps total (wall):** ${r.totalMs} ms`)
    if (!r.ok) {
      lines.push(`- **Error:** \`${r.errMsg.replace(/`/g, "'")}\``)
    }
    if (r.ok && r.spec) {
      lines.push(`- **Mètriques heurístiques:** ${qualityHints(r.spec)}`)
    }
    lines.push(
      `- **Tokens (suma passes):** ${hasUsage ? `prompt ${pt} · completion ${ct} · total ${tt}` : '— (cos sense `usage`)'}`,
    )
    lines.push('')
    lines.push(
      '| Fase | Model | Endpoint | Latència ms | prompt_tok | completion_tok | total_tok |',
    )
    lines.push(
      '|------|-------|----------|------------:|-----------:|---------------:|----------:|',
    )
    lines.push(formatTelemetryRows(r.rounds))
    lines.push('')
  }

  const v2 = results.find((x) => x.variant.id === 'V2')
  const enrichProOk =
    v2?.ok &&
    v2.rounds.some((t) => t.phase === 'assessment_spec_enrich' && t.model.includes('gpt-5.4-pro'))
  const enrichProResponses =
    v2?.ok &&
    v2.rounds.some((t) => t.phase === 'assessment_spec_enrich' && t.endpointKind === 'responses')

  lines.push('## Evidència `gpt-5.4-pro` (passada 2)')
  lines.push('')
  if (enrichProOk && enrichProResponses) {
    lines.push(
      '- **V2 OK:** la passada d’enriqueiment ha usat `gpt-5.4-pro` amb **`endpointKind: responses`** (vegeu taula V2).',
    )
  } else if (v2 && !v2.ok) {
    lines.push(
      '- **V2 fallida:** revisar error amunt. Per diagnòstic: endpoint esperat `POST …/v1/responses`, model `gpt-5.4-pro`, cos amb `input` = missatges sistema+usuari (guia migració OpenAI).',
    )
    if (v2.errMsg.includes('fetch failed') || v2.errMsg.includes('UND_ERR')) {
      lines.push(
        '- **Nota operativa:** `fetch failed` sovint indica tall de xarxa o timeout intermedi (el model **pro** pot trigar molts minuts). Prova de nou fora de Docker o amb sortida estable a `api.openai.com`.',
      )
    }
  } else {
    lines.push(
      '- **Atenció:** no s’ha pogut verificar V2 (falta execució o telemetria incompleta).',
    )
  }
  lines.push('')

  lines.push('## Qualitat (revisió manual)')
  lines.push('')
  lines.push(
    '| Variant | Enrich | Pregunta clau |',
    '|---------|--------|---------------|',
    '| V1 | gpt-5.4 | Baseline fort en chat; comparar amb V2. |',
    '| V2 | gpt-5.4-pro | ¿Criteris més específics / menys genèrics que V1? |',
  )
  if (runV3) {
    lines.push('| V3 | gpt-5.4-pro | Base més gran + pro (cost més alt). |')
  }
  lines.push('')

  lines.push('## Decisió defaults (MVP)')
  lines.push('')
  lines.push('- **Passada 1:** `gpt-5.4-mini`.')
  lines.push(
    '- **Passada 2:** `gpt-5.4-pro` (màxima qualitat pedagògica; `POST /v1/responses`). Comparar qualitat vs V1 abans de canviar.',
  )
  lines.push(
    '- **Alternativa econòmica:** `ASSESSMENT_SPEC_ENRICH_MODEL=gpt-5.4` si V1 és suficient.',
  )
  lines.push(
    '- **Compatibilitat:** `OPENAI_FORCE_CHAT_COMPLETIONS=1` només si el proveïdor no implementa `/v1/responses` (no és el camí principal OpenAI).',
  )
  lines.push('')
  lines.push(
    '**Evidència git:** commit amb missatge que inclogui `Feature 2.2` o `calibratge` / `gpt-5.4-pro` (`git log --oneline --grep=2.2`).',
  )
  lines.push('')

  const outPath = path.join(
    __dirname,
    '../../../docs/features/assessment-spec-builder/hospital-model-calibration-notes.md',
  )
  writeFileSync(outPath, lines.join('\n'), 'utf8')
  console.info(outPath)
}

await main()
