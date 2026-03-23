/**
 * Feature 2.2 — Calibratge models (cas hospital): executa el pipeline complet
 * amb combinacions base+enrich i escriu telemetria (latència, usage si hi és).
 *
 * Per defecte: variant 1 (mini + gpt-5.4) i variant 2 (mini + pro).
 * Variant 3 (gpt-5.4 + pro): `CALIBRATION_ASSESSMENT_SPEC_VARIANT3=1`
 *
 * Clau: ASSESSMENT_SPEC_OPENAI_API_KEY | OPENAI_API_KEY | FEATURE0_OPENAI_API_KEY
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { assessmentSpecSchema } from '../src/domain/assessment-spec/assessmentSpec.schema'
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

/** V1/V2: comparativa sota chat/completions (passada 2 més forta vs més lleugera). */
const VARIANTS: Variant[] = [
  { id: 'V1', baseModel: 'gpt-5.4-mini', enrichModel: 'gpt-5.4' },
  { id: 'V2', baseModel: 'gpt-5.4-mini', enrichModel: 'gpt-5.4-mini' },
  { id: 'V3', baseModel: 'gpt-5.4', enrichModel: 'gpt-5.4-pro' },
]

function formatTelemetryRows(rounds: AssessmentSpecLlmTelemetry[]): string {
  return rounds
    .map(
      (r) =>
        `| ${r.phase} | ${r.model} | ${r.latencyMs.toFixed(0)} | ${r.usage?.prompt_tokens ?? '—'} | ${r.usage?.completion_tokens ?? '—'} | ${r.usage?.total_tokens ?? '—'} |`,
    )
    .join('\n')
}

function sumTokens(
  rounds: AssessmentSpecLlmTelemetry[],
  k: keyof NonNullable<AssessmentSpecLlmTelemetry['usage']>,
): number {
  return rounds.reduce((acc, r) => acc + (r.usage?.[k] ?? 0), 0)
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

  const lines: string[] = [
    '# Calibratge models — Assessment Spec (cas hospital DAW)',
    '',
    `Data execució: ${new Date().toISOString()}`,
    '',
    'Pipeline: `buildAssessmentSpec` (passada 1) + `enrichAssessmentSpec` (passada 2).',
    '',
    '## Telemetria per variant',
    '',
  ]

  for (const v of toRun) {
    const rounds: AssessmentSpecLlmTelemetry[] = []
    const t0 = Date.now()
    let ok = false
    let errMsg = ''
    let qCount = 0
    try {
      const spec = await buildAssessmentSpecWithPedagogicEnrichment({
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

    const pt = sumTokens(rounds, 'prompt_tokens')
    const ct = sumTokens(rounds, 'completion_tokens')
    const tt = sumTokens(rounds, 'total_tokens')
    const hasUsage = rounds.some((r) => r.usage != null)

    lines.push(`### ${v.id}: base \`${v.baseModel}\` → enrich \`${v.enrichModel}\``)
    lines.push('')
    lines.push(`- **Schema OK:** ${ok ? 'sí' : 'no'}`)
    lines.push(`- **Preguntes:** ${qCount}`)
    lines.push(`- **Temps total (wall):** ${totalMs} ms`)
    if (!ok) {
      lines.push(`- **Error:** \`${errMsg.replace(/`/g, "'")}\``)
    }
    lines.push(
      `- **Tokens (suma passes):** ${hasUsage ? `prompt ${pt} · completion ${ct} · total ${tt}` : '— (cos sense `usage`)'}`,
    )
    lines.push('')
    lines.push('| Fase | Model | Latència ms | prompt_tok | completion_tok | total_tok |')
    lines.push('|------|-------|------------:|-----------:|---------------:|----------:|')
    lines.push(formatTelemetryRows(rounds))
    lines.push('')
  }

  lines.push('## Intent `gpt-5.4-pro` a passada 2')
  lines.push('')
  lines.push(
    'El model `gpt-5.4-pro` ha fallat en proves amb `v1/chat/completions` (missatge: no és model de chat en aquest endpoint). El defecte de passada 2 al codi és `gpt-5.4`. La taula V1/V2 contrasta enriqueidor `gpt-5.4` vs `gpt-5.4-mini`.',
  )
  lines.push('')
  lines.push('## Qualitat (revisió manual)')
  lines.push('')
  lines.push('| Variant | Passada 2 | Observacions pedagògiques |')
  lines.push('|---------|-----------|---------------------------|')
  lines.push(
    '| V1 | gpt-5.4 | Criteris més específics (restriccions, claus, coherència amb enunciat). |',
  )
  lines.push('| V2 | gpt-5.4-mini | Sovint acceptable però més genèric en blocs DDL repetitius. |')
  if (runV3) {
    lines.push('| V3 | gpt-5.4-pro | Només si l’API del compte ho admet al endpoint usat. |')
  }
  lines.push('')
  lines.push('## Cost estimat (orientatiu)')
  lines.push('')
  lines.push(
    'Mini a la passada 1 redueix cost; reservar model gran només per la passada 2 equilibra qualitat i preu.',
  )
  lines.push('')
  lines.push('## Decisió MVP')
  lines.push('')
  lines.push('- **Passada 1:** `gpt-5.4-mini`.')
  lines.push(
    '- **Passada 2:** `gpt-5.4` (`ASSESSMENT_SPEC_ENRICH_MODEL`). Reavaluar `gpt-5.4-pro` quan sigui invocable al mateix client HTTP o es migri API.',
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
