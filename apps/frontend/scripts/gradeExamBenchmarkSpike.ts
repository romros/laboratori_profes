/**
 * Spike 3.B — Comparació estructurada GPT vs Claude per grading Feature 3.
 *
 * Ús (des de apps/frontend):
 *   npm run spike:grade-exam-benchmark
 *
 * Necessita:
 *   FEATURE0_OPENAI_API_KEY  → OpenAI
 *   CLAUDE_API_KEY           → Anthropic
 *   PDFs a ../../data/ex_alumne{1,2,3}.pdf
 *
 * Genera: docs/spikes/spike-3b-model-comparison.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'

import { runQuestionAnswerExtractionFromPdf } from '../src/features/question-answer-extraction/services/runQuestionAnswerExtractionFromPdf'
import { buildEvaluateAnswerPrompt } from '../src/features/answer-evaluator/services/evaluateAnswerPrompt'
import { triageAnswerEvaluability } from '../src/features/answer-evaluator/services/triageAnswerEvaluability'
import type {
  AssessmentSpec,
  QuestionSpec,
} from '../src/domain/assessment-spec/assessmentSpec.schema'
import type { AnswerForEvaluation } from '../src/domain/answer-evaluator/answerEvaluator.schema'
import { hospitalDawExamDocumentContext } from '../tests/fixtures/assessment-spec-builder/hospitalDawGolden'
import { callOpenAiCompatibleChat } from '../src/features/template-inference/services/openAiCompatibleChat'

// ── Configuració ──────────────────────────────────────────────────────────────

const OPENAI_KEY = process.env.FEATURE0_OPENAI_API_KEY || process.env.OPENAI_API_KEY
const CLAUDE_KEY = process.env.CLAUDE_API_KEY

if (!OPENAI_KEY) {
  console.error('Cal FEATURE0_OPENAI_API_KEY')
  process.exit(1)
}
if (!CLAUDE_KEY) {
  console.error('Cal CLAUDE_API_KEY')
  process.exit(1)
}

const ENRICHED_FIXTURE = resolve(
  process.cwd(),
  'tests/fixtures/assessment-spec-builder/hospitalDawGolden.enriched-output.json',
)
const spec = JSON.parse(readFileSync(ENRICHED_FIXTURE, 'utf8')) as AssessmentSpec
const specById = new Map(spec.questions.map((q) => [q.question_id, q]))

const PDF_PATHS = [
  resolve(process.cwd(), '../../data/ex_alumne2.pdf'), // alumne2: 15/15 detectades (OCR bo)
  resolve(process.cwd(), '../../data/ex_alumne3.pdf'), // alumne3: 14/15 detectades (OCR bo)
  resolve(process.cwd(), '../../data/ex_alumne1.pdf'), // alumne1: OCR parcial
].filter((p) => existsSync(p))

if (PDF_PATHS.length === 0) {
  console.error("No s'han trobat PDFs a ../../data/ex_alumne{1,2,3}.pdf")
  process.exit(1)
}

// ── Schemas LLM ───────────────────────────────────────────────────────────────

const llmVerdictSchema = z.object({
  verdict: z.enum(['correct', 'partial', 'incorrect']),
  feedback: z.string(),
  confidence: z.number().min(0).max(1),
})

type ModelResult = {
  verdict: 'correct' | 'partial' | 'incorrect' | null
  feedback: string | null
  confidence: number | null
  latencyMs: number
  error?: string
}

type ComparisonRow = {
  student_id: string
  question_id: string
  question_text: string
  ocr_status: string
  answer_text: string
  gpt: ModelResult
  claude: ModelResult
  verdict_match: boolean
}

// ── Crida OpenAI ──────────────────────────────────────────────────────────────

async function gradeOpenAI(q: QuestionSpec, answer: AnswerForEvaluation): Promise<ModelResult> {
  const t0 = Date.now()
  const triage = triageAnswerEvaluability(answer)
  if (triage.evaluable_by_ocr === 'no')
    return { verdict: null, feedback: null, confidence: null, latencyMs: 0 }
  const prompt = buildEvaluateAnswerPrompt({
    questionSpec: q,
    answerText: answer.answer_text,
    examDocumentContext: hospitalDawExamDocumentContext,
  })
  try {
    const raw = await callOpenAiCompatibleChat({
      apiKey: OPENAI_KEY!,
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-5.4',
      messages: [
        {
          role: 'system',
          content:
            'Ets un avaluador pedagògic expert. Respon NOMÉS amb JSON vàlid, sense markdown ni text fora del JSON.',
        },
        { role: 'user', content: prompt },
      ],
    })
    const p = llmVerdictSchema.parse(JSON.parse(raw.trim()))
    return {
      verdict: p.verdict,
      feedback: p.feedback,
      confidence: p.confidence,
      latencyMs: Date.now() - t0,
    }
  } catch (e) {
    return {
      verdict: null,
      feedback: null,
      confidence: null,
      latencyMs: Date.now() - t0,
      error: String(e),
    }
  }
}

// ── Crida Claude ──────────────────────────────────────────────────────────────

async function gradeClaude(q: QuestionSpec, answer: AnswerForEvaluation): Promise<ModelResult> {
  const t0 = Date.now()
  const triage = triageAnswerEvaluability(answer)
  if (triage.evaluable_by_ocr === 'no')
    return { verdict: null, feedback: null, confidence: null, latencyMs: 0 }
  const prompt = buildEvaluateAnswerPrompt({
    questionSpec: q,
    answerText: answer.answer_text,
    examDocumentContext: hospitalDawExamDocumentContext,
  })
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system:
          "Ets un avaluador pedagògic expert. Avalues respostes d'alumnes contra un AssessmentSpec del professor. Respon NOMÉS amb JSON vàlid, sense markdown ni text fora del JSON.",
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const body = (await res.json()) as {
      content?: { type: string; text: string }[]
      error?: { message: string }
    }
    if (!res.ok) throw new Error(body.error?.message ?? `HTTP ${res.status}`)
    const text = body.content?.find((c) => c.type === 'text')?.text ?? ''
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()
    const p = llmVerdictSchema.parse(JSON.parse(cleaned))
    return {
      verdict: p.verdict,
      feedback: p.feedback,
      confidence: p.confidence,
      latencyMs: Date.now() - t0,
    }
  } catch (e) {
    return {
      verdict: null,
      feedback: null,
      confidence: null,
      latencyMs: Date.now() - t0,
      error: String(e),
    }
  }
}

// ── Pipeline principal ────────────────────────────────────────────────────────

const allRows: ComparisonRow[] = []

for (const pdfPath of PDF_PATHS) {
  const studentId = pdfPath.replace(/.*ex_alumne(\d+)\.pdf$/, 'alumne-$1')
  console.error(`\n[${studentId}] Processant OCR de ${pdfPath}...`)

  const buf = readFileSync(pdfPath)
  const { result: qaeResult } = await runQuestionAnswerExtractionFromPdf(buf)

  console.error(`[${studentId}] ${qaeResult.items.length} preguntes detectades per OCR`)

  // Ordenem per question_id numèric i limitem a les primeres 8 per cost
  const items = [...qaeResult.items]
    .filter((item) => item.status !== 'empty' || item.question_id <= 'Q5') // inclou empties fins Q5
    .slice(0, 8)

  console.error(`[${studentId}] Avaluant ${items.length} preguntes...`)

  for (const item of items) {
    // QAE retorna "1","2"... — AssessmentSpec usa "Q1","Q2"...
    const specKey = item.question_id.startsWith('Q') ? item.question_id : `Q${item.question_id}`
    const q = specById.get(specKey)
    if (!q) {
      console.error(
        `[${studentId}] ${item.question_id} → ${specKey} no trobat a l'AssessmentSpec, skip`,
      )
      continue
    }

    const answer: AnswerForEvaluation = {
      question_id: q.question_id, // usa l'ID canònic de l'AssessmentSpec (ex: "Q1")
      answer_text: item.answer_text,
      ocr_status: item.status as 'ok' | 'uncertain' | 'empty' | 'not_detected',
    }

    process.stderr.write(`  ${specKey} [${item.status}]... `)
    const [gpt, claude] = await Promise.all([gradeOpenAI(q, answer), gradeClaude(q, answer)])
    console.error(`GPT:${gpt.verdict ?? 'no'} Claude:${claude.verdict ?? 'no'}`)

    allRows.push({
      student_id: studentId,
      question_id: item.question_id,
      question_text: q.question_text,
      ocr_status: item.status,
      answer_text: item.answer_text,
      gpt,
      claude,
      verdict_match: gpt.verdict === claude.verdict,
    })
  }
}

// ── Anàlisi ───────────────────────────────────────────────────────────────────

const gradedRows = allRows.filter((r) => r.gpt.verdict !== null && r.claude.verdict !== null)
const noEvalRows = allRows.filter((r) => r.gpt.verdict === null && r.claude.verdict === null)
const matches = gradedRows.filter((r) => r.verdict_match).length
const discrepancies = gradedRows.filter((r) => !r.verdict_match)

const okRows = gradedRows.filter((r) => r.ocr_status === 'ok')
const uncertainRows = gradedRows.filter((r) => r.ocr_status === 'uncertain')

const avgConfGpt = (rows: typeof gradedRows) =>
  rows.length
    ? (rows.reduce((s, r) => s + (r.gpt.confidence ?? 0), 0) / rows.length).toFixed(2)
    : '—'
const avgConfClaude = (rows: typeof gradedRows) =>
  rows.length
    ? (rows.reduce((s, r) => s + (r.claude.confidence ?? 0), 0) / rows.length).toFixed(2)
    : '—'
const avgLatGpt = (rows: typeof allRows) =>
  rows.length ? Math.round(rows.reduce((s, r) => s + r.gpt.latencyMs, 0) / rows.length) : 0
const avgLatClaude = (rows: typeof allRows) =>
  rows.length ? Math.round(rows.reduce((s, r) => s + r.claude.latencyMs, 0) / rows.length) : 0

// ── Generació del report Markdown ─────────────────────────────────────────────

function verdictIcon(v: string | null): string {
  if (v === 'correct') return '✅ correct'
  if (v === 'partial') return '🟡 partial'
  if (v === 'incorrect') return '❌ incorrect'
  return '— (no avaluat)'
}

function truncate(s: string | null, n = 200): string {
  if (!s) return '—'
  return s.length > n ? s.slice(0, n) + '…' : s
}

function escMd(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

let md = `# Spike 3.B — Comparació de models per grading Feature 3

**Data:** ${new Date().toISOString().slice(0, 10)}
**Models:** \`gpt-5.4\` (OpenAI) vs \`claude-sonnet-4-6\` (Anthropic)
**Prompt:** idèntic (MODE PROFESSOR + MODE AVALUACIÓ + CONTEXT OCR + GUARDRAIL)
**Input:** ${PDF_PATHS.length} PDFs reals OCR (ex_alumne2, ex_alumne3, ex_alumne1)
**AssessmentSpec:** \`hospitalDawGolden.enriched-output.json\`

---

## Resum global

| Mètrica | Valor |
|---------|-------|
| Total preguntes comparades | ${allRows.length} |
| Preguntes amb veredicte (ambdós models) | ${gradedRows.length} |
| No avaluades (OCR buit / no detectat) | ${noEvalRows.length} |
| **Concordança de veredicte** | **${gradedRows.length ? Math.round((matches / gradedRows.length) * 100) : 0}% (${matches}/${gradedRows.length})** |
| Discrepàncies | ${discrepancies.length} |

### Per qualitat OCR

| Qualitat OCR | N | Concordança | GPT conf. avg | Claude conf. avg | GPT lat. avg | Claude lat. avg |
|---|---|---|---|---|---|---|
| \`ok\` | ${okRows.length} | ${okRows.length ? Math.round((okRows.filter((r) => r.verdict_match).length / okRows.length) * 100) : 0}% | ${avgConfGpt(okRows)} | ${avgConfClaude(okRows)} | ${avgLatGpt(okRows)}ms | ${avgLatClaude(okRows)}ms |
| \`uncertain\` | ${uncertainRows.length} | ${uncertainRows.length ? Math.round((uncertainRows.filter((r) => r.verdict_match).length / uncertainRows.length) * 100) : 0}% | ${avgConfGpt(uncertainRows)} | ${avgConfClaude(uncertainRows)} | ${avgLatGpt(uncertainRows)}ms | ${avgLatClaude(uncertainRows)}ms |

---

## Comparació per pregunta i alumne

`

for (const row of allRows) {
  const match = row.verdict_match ? '✓ acord' : '⚠ discrepància'
  md += `### ${row.student_id} — ${row.question_id} [ocr: \`${row.ocr_status}\`] ${match}\n\n`
  md += `**Pregunta:** ${escMd(row.question_text)}\n\n`

  // Resposta de l'alumne (primeres 400 chars)
  const answerDisplay = row.answer_text.trim()
  if (answerDisplay) {
    md += `**Resposta de l'alumne (OCR):**\n\`\`\`\n${truncate(answerDisplay, 400)}\n\`\`\`\n\n`
  } else {
    md += `**Resposta de l'alumne:** *(buida — OCR status: ${row.ocr_status})*\n\n`
  }

  if (row.gpt.verdict === null && row.claude.verdict === null) {
    md += `> No avaluat (guardrail OCR — status: \`${row.ocr_status}\`)\n\n`
  } else {
    md += `| | gpt-5.4 | claude-sonnet-4-6 |\n|---|---|---|\n`
    md += `| **Verdict** | ${verdictIcon(row.gpt.verdict)} | ${verdictIcon(row.claude.verdict)} |\n`
    md += `| **Confidence** | ${row.gpt.confidence?.toFixed(2) ?? '—'} | ${row.claude.confidence?.toFixed(2) ?? '—'} |\n`
    md += `| **Latència** | ${row.gpt.latencyMs}ms | ${row.claude.latencyMs}ms |\n\n`

    if (row.gpt.error) md += `> ⚠ GPT error: ${row.gpt.error}\n\n`
    if (row.claude.error) md += `> ⚠ Claude error: ${row.claude.error}\n\n`

    if (row.gpt.feedback) md += `**Feedback GPT:** ${escMd(truncate(row.gpt.feedback, 300))}\n\n`
    if (row.claude.feedback)
      md += `**Feedback Claude:** ${escMd(truncate(row.claude.feedback, 300))}\n\n`

    if (!row.verdict_match) {
      md += `> ⚠ **Discrepància:** GPT=${row.gpt.verdict}, Claude=${row.claude.verdict}\n\n`
    }
  }

  md += `---\n\n`
}

// ── Discrepàncies destacades ──────────────────────────────────────────────────

if (discrepancies.length > 0) {
  md += `## Discrepàncies de veredicte\n\n`
  md += `| Student | Q | OCR | GPT | Claude |\n|---|---|---|---|---|\n`
  for (const r of discrepancies) {
    md += `| ${r.student_id} | ${r.question_id} | \`${r.ocr_status}\` | ${r.gpt.verdict} | ${r.claude.verdict} |\n`
  }
  md += `\n---\n\n`
} else {
  md += `## Discrepàncies de veredicte\n\nCap discrepància detectada.\n\n---\n\n`
}

// ── Observacions qualitatives ─────────────────────────────────────────────────

md += `## Observacions qualitatives

*(A completar manualment després de revisar les dades)*

- **Acceptació de variants:** [observació]
- **OCR robustness:** [observació]
- **Feedback:** GPT tendeix a ser [concís/verbós]; Claude tendeix a ser [concís/verbós]
- **Confiança:** [observació sobre calibratge]
- **Triage coherència:** [observació]

---

## Decisió

### Opció triada

> [ ] Opció A — GPT guanya clarament → es manté GPT
> [ ] Opció B — Claude guanya clarament → es canvia model
> [ ] Opció C — mixt → estratègia combinada

### Justificació

*(A completar)*

---

## Dades raw (JSON)

\`\`\`json
${JSON.stringify(
  allRows.map((r) => ({
    student_id: r.student_id,
    question_id: r.question_id,
    ocr_status: r.ocr_status,
    verdict_match: r.verdict_match,
    gpt_verdict: r.gpt.verdict,
    gpt_confidence: r.gpt.confidence,
    claude_verdict: r.claude.verdict,
    claude_confidence: r.claude.confidence,
  })),
  null,
  2,
)}
\`\`\`
`

// ── Escriptura del fitxer ─────────────────────────────────────────────────────

const outPath = resolve(process.cwd(), '../../docs/spikes/spike-3b-model-comparison.md')
writeFileSync(outPath, md, 'utf8')
console.error(`\n✅ Report escrit a ${outPath}`)

// ── Resum a stdout ────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(60))
console.log('RESUM SPIKE 3.B')
console.log('='.repeat(60))
console.log(`Total preguntes: ${allRows.length}`)
console.log(`Amb veredicte: ${gradedRows.length}  No avaluades: ${noEvalRows.length}`)
console.log(
  `Concordança: ${gradedRows.length ? Math.round((matches / gradedRows.length) * 100) : 0}% (${matches}/${gradedRows.length})`,
)
console.log(`Discrepàncies: ${discrepancies.length}`)
if (discrepancies.length > 0) {
  for (const r of discrepancies) {
    console.log(
      `  ↳ ${r.student_id} ${r.question_id} [${r.ocr_status}]: GPT=${r.gpt.verdict} Claude=${r.claude.verdict}`,
    )
  }
}
console.log(`\nGPT  conf.avg (ok): ${avgConfGpt(okRows)}  lat.avg: ${avgLatGpt(allRows)}ms`)
console.log(`Claude conf.avg (ok): ${avgConfClaude(okRows)}  lat.avg: ${avgLatClaude(allRows)}ms`)
console.log('='.repeat(60))
console.log(`Report complet: docs/spikes/spike-3b-model-comparison.md`)
