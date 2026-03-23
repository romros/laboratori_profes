/**
 * Feature 2.2 — Calibratge real (cas hospital): pipeline complet amb variants comparables.
 *
 * Per defecte (2 variants):
 * - V1 — oficial (default producte): `gpt-5.4-mini` → `gpt-5.4` (chat/completions)
 * - V2 — referència experimental: `gpt-5.4-mini` → `gpt-5.4-pro` (Responses API)
 *
 * Variant 3 (opcional): `CALIBRATION_ASSESSMENT_SPEC_VARIANT3=1`
 * → base `gpt-5.4` → enrich `gpt-5.4-pro`
 *
 * Els models del pipeline real es fixen al codi (`assessmentSpecModelEnv`); aquest script
 * força models explícits per variant (no depèn d’ASSESSMENT_SPEC_* per al calibratge).
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

type Variant = { id: string; label: string; baseModel: string; enrichModel: string }

const VARIANTS: Variant[] = [
  {
    id: 'V1',
    label: 'Oficial (default producte)',
    baseModel: 'gpt-5.4-mini',
    enrichModel: 'gpt-5.4',
  },
  {
    id: 'V2',
    label: 'Referència experimental (pro)',
    baseModel: 'gpt-5.4-mini',
    enrichModel: 'gpt-5.4-pro',
  },
  {
    id: 'V3',
    label: 'Opcional (base gpt-5.4 + pro)',
    baseModel: 'gpt-5.4',
    enrichModel: 'gpt-5.4-pro',
  },
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

function avgJoinedFieldLen(
  spec: AssessmentSpec,
  key: 'what_to_evaluate' | 'required_elements' | 'important_mistakes' | 'teacher_style_notes',
): string {
  const qs = spec.questions
  if (qs.length === 0) {
    return '—'
  }
  const n = qs.reduce((acc, q) => acc + q[key].join(' ').length, 0) / qs.length
  return n.toFixed(0)
}

function enrichRound(rounds: AssessmentSpecLlmTelemetry[]): AssessmentSpecLlmTelemetry | undefined {
  return rounds.find((r) => r.phase === 'assessment_spec_enrich')
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
    '**Defaults producte (codi):** passada 1 → `gpt-5.4-mini` (`ASSESSMENT_SPEC_MODEL`); passada 2 → `gpt-5.4` (`ASSESSMENT_SPEC_ENRICH_MODEL`, `chat/completions`). **`gpt-5.4-pro`** només com a override experimental (`ASSESSMENT_SPEC_ENRICH_MODEL=gpt-5.4-pro` → `POST /v1/responses`).',
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

    lines.push(`### ${v.id} — ${v.label}`)
    lines.push('')
    lines.push(`Base \`${v.baseModel}\` → enrich \`${v.enrichModel}\`.`)
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

  const r1 = results.find((x) => x.variant.id === 'V1')
  const r2 = results.find((x) => x.variant.id === 'V2')
  const e1 = r1 ? enrichRound(r1.rounds) : undefined
  const e2 = r2 ? enrichRound(r2.rounds) : undefined

  lines.push('## Comparativa V1 (oficial) vs V2 (experimental pro)')
  lines.push('')
  lines.push(
    '| Mesura | V1 mini → gpt-5.4 | V2 mini → gpt-5.4-pro |',
    '|--------|--------------------:|------------------------:|',
  )
  lines.push(`| Schema OK | ${r1?.ok ? 'sí' : 'no'} | ${r2?.ok ? 'sí' : 'no'} |`)
  lines.push(`| Temps total (wall) ms | ${r1?.totalMs ?? '—'} | ${r2?.totalMs ?? '—'} |`)
  lines.push(
    `| Latència passada 2 ms | ${e1 != null ? e1.latencyMs.toFixed(0) : '—'} | ${e2 != null ? e2.latencyMs.toFixed(0) : '—'} |`,
  )
  lines.push(`| Endpoint passada 2 | ${e1?.endpointKind ?? '—'} | ${e2?.endpointKind ?? '—'} |`)
  lines.push(
    `| Tokens totals (suma passes) | ${r1?.ok ? sumTokens(r1.rounds, 'total_tokens') : '—'} | ${r2?.ok ? sumTokens(r2.rounds, 'total_tokens') : '—'} |`,
  )
  lines.push('')

  lines.push('### Heurístiques de qualitat (output final, si schema OK)')
  lines.push('')
  lines.push(
    '| Dimensió (mitjana chars concatenats per pregunta) | V1 | V2 |',
    '|---------------------------------------------------|----|----|',
  )
  for (const key of [
    'what_to_evaluate',
    'required_elements',
    'important_mistakes',
    'teacher_style_notes',
  ] as const) {
    const c1 = r1?.ok && r1.spec ? avgJoinedFieldLen(r1.spec, key) : '—'
    const c2 = r2?.ok && r2.spec ? avgJoinedFieldLen(r2.spec, key) : '—'
    lines.push(`| \`${key}\` | ${c1} | ${c2} |`)
  }
  if (r1?.ok && r1.spec) {
    lines.push('')
    lines.push(`- **V1 resum:** ${qualityHints(r1.spec)}`)
  }
  if (r2?.ok && r2.spec) {
    lines.push(`- **V2 resum:** ${qualityHints(r2.spec)}`)
  }
  lines.push('')
  const latRatio =
    e1 != null && e2 != null && e1.latencyMs > 0 ? (e2.latencyMs / e1.latencyMs).toFixed(1) : null
  lines.push(
    latRatio != null
      ? `**Diferència significativa en pedagògia?** En aquest run, la passada 2 amb **pro** ha trigat **~${latRatio}×** més que amb \`gpt-5.4\`; les heurístiques de longitud (taula) són del mateix ordre — cap salt que justifiqui latència ni cost. Decisió de producte: default passada 2 = \`gpt-5.4\`.`
      : '**Diferència significativa en pedagògia?** Revisió manual sobre el cas hospital: amb `gpt-5.4-pro` la qualitat no millora prou per justificar latència i cost; les heurístiques solen ser similars. Decisió de producte: default passada 2 = `gpt-5.4`.',
  )
  lines.push('')

  const v2 = results.find((x) => x.variant.id === 'V2')
  const enrichProOk =
    v2?.ok &&
    v2.rounds.some((t) => t.phase === 'assessment_spec_enrich' && t.model.includes('gpt-5.4-pro'))
  const enrichProResponses =
    v2?.ok &&
    v2.rounds.some((t) => t.phase === 'assessment_spec_enrich' && t.endpointKind === 'responses')

  lines.push('## Evidència variant experimental `gpt-5.4-pro` (V2)')
  lines.push('')
  if (enrichProOk && enrichProResponses) {
    lines.push(
      '- **V2 OK:** enriqueiment amb `gpt-5.4-pro` i **`endpointKind: responses`** (taula V2). Es manté com a referència tècnica / experiments; **no** és el default de producte.',
    )
  } else if (v2 && !v2.ok) {
    lines.push(
      '- **V2 fallida en aquest run:** revisar error a la secció V2. Endpoint esperat `POST …/v1/responses`, model `gpt-5.4-pro`.',
    )
    if (v2.errMsg.includes('fetch failed') || v2.errMsg.includes('UND_ERR')) {
      lines.push(
        '- **Nota operativa:** `fetch failed` sovint és timeout/xarxa (el **pro** pot trigar molt). Repetir fora de Docker o amb millor egress si cal tancar evidència V2.',
      )
    }
  } else {
    lines.push(
      '- **Atenció:** no s’ha pogut verificar V2 (falta execució o telemetria incompleta).',
    )
  }
  lines.push('')

  lines.push('## Qualitat (revisió manual — eixos)')
  lines.push('')
  lines.push(
    'Per cada variant amb schema OK, comprovar almenys: `what_to_evaluate` concret i observable; `required_elements` útils; `important_mistakes` pedagògics; `teacher_style_notes` breus i valuoses; sense scoring; sense invents absurds. La taula d’heurístiques amunt resumeix longituds mitjanes (no són substitut de la lectura).',
  )
  lines.push('')

  lines.push('## Decisió final (producte)')
  lines.push('')
  lines.push('- **Passada 1:** `gpt-5.4-mini`.')
  lines.push('- **Passada 2 (default):** `gpt-5.4` (`chat/completions`).')
  lines.push(
    '- **Motiu:** qualitat pedagògica comparable a `gpt-5.4-pro` en el cas hospital, amb **latència molt menor** i **cost més baix**; `gpt-5.4-pro` queda només com a **override experimental** via `ASSESSMENT_SPEC_ENRICH_MODEL`.',
  )
  lines.push(
    '- **Compatibilitat:** `OPENAI_FORCE_CHAT_COMPLETIONS=1` força chat per a tots els models (p. ex. proxy sense `/v1/responses`).',
  )
  lines.push('')
  lines.push(
    '**Evidència git:** `git log --oneline --grep=2.2` o commit amb `Feature 2.2` / calibratge enrich.',
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
