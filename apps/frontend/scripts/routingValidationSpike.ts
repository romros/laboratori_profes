/**
 * Spike 3.D — Validació del canal `text` del router pre-LLM.
 *
 * Ús (des de apps/frontend):
 *   npm run spike:routing-validation
 *
 * Necessita:
 *   FEATURE0_OPENAI_API_KEY  → OpenAI (QAE + grading GPT)
 *   CLAUDE_API_KEY           → Anthropic Claude (grading)
 *   PDFs a ../../data/ex_alumne{1,2,3}.pdf
 *
 * Genera: docs/spikes/spike-3d-text-channel-validation.md
 *
 * Pregunta central:
 *   Les preguntes que el router envia a `text` són realment avaluables?
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'

import { runQuestionAnswerExtractionFromPdf } from '../src/features/question-answer-extraction/services/runQuestionAnswerExtractionFromPdf'
import { routeQuestionForEvaluation } from '../src/features/answer-evaluator/services/routeQuestionForEvaluation'
import { buildEvaluateAnswerPrompt } from '../src/features/answer-evaluator/services/evaluateAnswerPrompt'
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
  resolve(process.cwd(), '../../data/ex_alumne2.pdf'),
  resolve(process.cwd(), '../../data/ex_alumne3.pdf'),
  resolve(process.cwd(), '../../data/ex_alumne1.pdf'),
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

type DiscrepancyClass = 'gpt_correct' | 'claude_correct' | 'both_bad' | 'unclear'

type DiagnosticClass =
  | 'ROUTER_TOO_PERMISSIVE'
  | 'OCR_TOO_NOISY_FOR_TEXT'
  | 'GRADER_LIMITATION'
  | 'PROMPT_ISSUE'

type ValidationRow = {
  student_id: string
  question_id: string
  question_text: string
  ocr_status: string
  answer_text: string
  routing_reason: string
  gpt: ModelResult
  claude: ModelResult
  verdict_match: boolean
  discrepancy_class?: DiscrepancyClass
  diagnostic?: DiagnosticClass
  notes?: string
}

// ── Crida GPT ─────────────────────────────────────────────────────────────────

async function gradeGpt(q: QuestionSpec, answer: AnswerForEvaluation): Promise<ModelResult> {
  const t0 = Date.now()
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

// ── Classificació automàtica de discrepàncies ─────────────────────────────────
//
// Heurística: si un model té confiança ≥ 0.6 i l'altre < 0.4, el d'alta
// confiança té més probabilitat de ser correcte. Si ambdós < 0.4 → both_bad.
// Altrament → unclear (cal revisió manual).

function classifyDiscrepancy(row: ValidationRow): DiscrepancyClass {
  const gc = row.gpt.confidence ?? 0
  const cc = row.claude.confidence ?? 0

  if (gc < 0.4 && cc < 0.4) return 'both_bad'
  if (gc >= 0.6 && cc < 0.4) return 'gpt_correct'
  if (cc >= 0.6 && gc < 0.4) return 'claude_correct'
  return 'unclear'
}

// ── Diagnòstic automàtic ──────────────────────────────────────────────────────
//
// Classifica el problema principal per a les discrepàncies.

function diagnose(row: ValidationRow): DiagnosticClass {
  const gc = row.gpt.confidence ?? 0
  const cc = row.claude.confidence ?? 0
  const text = row.answer_text

  // Soroll alt detectable: si el feedback dels dos menciona que no pot llegir
  const bothMentionOcr =
    (row.gpt.feedback?.toLowerCase().includes('ocr') ||
      row.gpt.feedback?.toLowerCase().includes('llegir') ||
      row.gpt.feedback?.toLowerCase().includes('difícil')) &&
    (row.claude.feedback?.toLowerCase().includes('ocr') ||
      row.claude.feedback?.toLowerCase().includes('llegir') ||
      row.claude.feedback?.toLowerCase().includes('difícil'))

  if (bothMentionOcr) return 'OCR_TOO_NOISY_FOR_TEXT'

  // Confiança molt baixa als dos → el grader no pot decidir
  if (gc < 0.35 && cc < 0.35) return 'GRADER_LIMITATION'

  // Text curt o amb molt de soroll → router massa permissiu
  const words = text.trim().split(/\s+/).length
  if (words < 5 || text.length < 20) return 'ROUTER_TOO_PERMISSIVE'

  return 'PROMPT_ISSUE'
}

// ── Pipeline principal ────────────────────────────────────────────────────────

const allRows: ValidationRow[] = []
const skippedByRouter: {
  student_id: string
  question_id: string
  ocr_status: string
  reason: string
}[] = []

console.error('\n' + '='.repeat(60))
console.error('SPIKE 3.D — Validació canal text del router')
console.error('='.repeat(60))

for (const pdfPath of PDF_PATHS) {
  const studentId = pdfPath.replace(/.*ex_alumne(\d+)\.pdf$/, 'alumne-$1')
  console.error(`\n[${studentId}] OCR...`)

  const buf = readFileSync(pdfPath)
  const { result: qaeResult } = await runQuestionAnswerExtractionFromPdf(buf)
  console.error(`[${studentId}] ${qaeResult.items.length} preguntes detectades`)

  for (const item of qaeResult.items) {
    const specKey = item.question_id.startsWith('Q') ? item.question_id : `Q${item.question_id}`
    const q = specById.get(specKey)
    if (!q) continue

    const answer: AnswerForEvaluation = {
      question_id: specKey,
      answer_text: item.answer_text,
      ocr_status: item.status as 'ok' | 'uncertain' | 'empty' | 'not_detected',
    }

    const routing = routeQuestionForEvaluation(answer)

    if (routing.route !== 'text') {
      skippedByRouter.push({
        student_id: studentId,
        question_id: specKey,
        ocr_status: item.status,
        reason: routing.reason,
      })
      console.error(`  ${specKey} [${item.status}] → ${routing.route} (skip per router)`)
      continue
    }

    process.stderr.write(`  ${specKey} [${item.status}] → text — gradint... `)
    const [gpt, claude] = await Promise.all([gradeGpt(q, answer), gradeClaude(q, answer)])
    const match = gpt.verdict === claude.verdict
    console.error(
      `GPT:${gpt.verdict ?? 'err'} Claude:${claude.verdict ?? 'err'} ${match ? '✓' : '⚠'}`,
    )

    const row: ValidationRow = {
      student_id: studentId,
      question_id: specKey,
      question_text: q.question_text,
      ocr_status: item.status,
      answer_text: item.answer_text,
      routing_reason: routing.reason,
      gpt,
      claude,
      verdict_match: match,
    }

    if (!match) {
      row.discrepancy_class = classifyDiscrepancy(row)
      row.diagnostic = diagnose(row)
    }

    allRows.push(row)
  }
}

// ── Mètriques ─────────────────────────────────────────────────────────────────

const total = allRows.length
const matches = allRows.filter((r) => r.verdict_match).length
const discrepancies = allRows.filter((r) => !r.verdict_match)
const concordance = total > 0 ? Math.round((matches / total) * 100) : 0

const avgConf = (getter: (r: ValidationRow) => number | null) => {
  const vals = allRows.map(getter).filter((v): v is number => v !== null)
  return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2) : '—'
}
const avgGptConf = avgConf((r) => r.gpt.confidence)
const avgClaudeConf = avgConf((r) => r.claude.confidence)

// Confiança < 0.4 → cas dubtós
const lowConfCount = allRows.filter(
  (r) => (r.gpt.confidence ?? 1) < 0.4 && (r.claude.confidence ?? 1) < 0.4,
).length
const lowConfPct = total > 0 ? Math.round((lowConfCount / total) * 100) : 0

// Discrepàncies per diagnòstic
const diagCounts: Record<DiagnosticClass, number> = {
  ROUTER_TOO_PERMISSIVE: 0,
  OCR_TOO_NOISY_FOR_TEXT: 0,
  GRADER_LIMITATION: 0,
  PROMPT_ISSUE: 0,
}
for (const r of discrepancies) {
  if (r.diagnostic) diagCounts[r.diagnostic]++
}

// ── Generar Markdown ──────────────────────────────────────────────────────────

function verdictIcon(v: string | null): string {
  if (v === 'correct') return '✅ correct'
  if (v === 'partial') return '🟡 partial'
  if (v === 'incorrect') return '❌ incorrect'
  return '— (error)'
}

function truncate(s: string | null, n = 250): string {
  if (!s) return '—'
  return s.length > n ? s.slice(0, n) + '…' : s
}

function escMd(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

// Diagnòstic global
let globalDiagnosis: string
let routerStatus: string
if (concordance >= 60) {
  routerStatus = '**ESTABLE** ✅'
  globalDiagnosis = `Concordança del ${concordance}% dins del llindar acceptable (≥60%). El canal \`text\` és fiable.`
} else if (concordance >= 40) {
  routerStatus = '**MODERAT** 🟡'
  globalDiagnosis = `Concordança del ${concordance}% per sota del llindar acceptable (≥60%). Ajustaments recomanats al router.`
} else {
  routerStatus = '**NO ESTABLE** ❌'
  globalDiagnosis = `Concordança del ${concordance}% molt per sota del llindar (≥60%). El router està mal calibrat.`
}

let md = `# Spike 3.D — Validació del canal \`text\` del router

**Data:** ${new Date().toISOString().slice(0, 10)}
**Models:** \`gpt-5.4\` (OpenAI) vs \`claude-sonnet-4-6\` (Anthropic)
**Input:** ${PDF_PATHS.length} PDFs reals OCR (ex_alumne2, ex_alumne3, ex_alumne1)
**AssessmentSpec:** \`hospitalDawGolden.enriched-output.json\`
**Router:** \`routeQuestionForEvaluation\` (Spike 3.C)

---

## Resposta a les preguntes clau

> **El canal \`text\` és ${routerStatus}**
>
> ${globalDiagnosis}
>
> * Concordança = **${concordance}%** (${matches}/${total})
> * Confiança GPT avg = **${avgGptConf}**
> * Confiança Claude avg = **${avgClaudeConf}**
> * Casos dubtosos (conf < 0.4 als dos models) = **${lowConfPct}%** (${lowConfCount}/${total})
>
> **Decisió:** ${concordance >= 60 ? 'Mantenir router — calibrat correctament' : concordance >= 40 ? 'Ajustar heurístiques del router (MAX_NOISE_RATIO o MIN_TEXT_LENGTH)' : 'Recalibrar router — criteris massa permissius'}

---

## Resum de routing

| Categoria | N |
|-----------|---|
| Preguntes enviades a \`text\` (analitzades) | ${total} |
| Preguntes descartades per router (\`skip\`/\`vision\`) | ${skippedByRouter.length} |
| **Total preguntes OCR processades** | **${total + skippedByRouter.length}** |
| % filtrades pel router | ${total + skippedByRouter.length > 0 ? Math.round((skippedByRouter.length / (total + skippedByRouter.length)) * 100) : 0}% |

---

## Mètriques del canal \`text\`

| Mètrica | Valor | Llindar | Estat |
|---------|-------|---------|-------|
| Concordança GPT vs Claude | **${concordance}%** | ≥60% | ${concordance >= 60 ? '✅' : concordance >= 40 ? '🟡' : '❌'} |
| Confiança GPT (avg) | **${avgGptConf}** | >0.50 | ${parseFloat(avgGptConf) > 0.5 ? '✅' : '🟡'} |
| Confiança Claude (avg) | **${avgClaudeConf}** | >0.50 | ${parseFloat(avgClaudeConf) > 0.5 ? '✅' : '🟡'} |
| Casos dubtosos (ambdós < 0.4) | **${lowConfPct}%** | <20% | ${lowConfPct < 20 ? '✅' : lowConfPct < 40 ? '🟡' : '❌'} |
| Discrepàncies | **${discrepancies.length}/${total}** | — | — |

---

## Classificació de discrepàncies

| Diagnòstic | N | Descripció |
|------------|---|------------|
| \`ROUTER_TOO_PERMISSIVE\` | ${diagCounts.ROUTER_TOO_PERMISSIVE} | Text ha passat el router però és massa curt o sorollós |
| \`OCR_TOO_NOISY_FOR_TEXT\` | ${diagCounts.OCR_TOO_NOISY_FOR_TEXT} | Ambdós models mencionen dificultat de lectura OCR |
| \`GRADER_LIMITATION\` | ${diagCounts.GRADER_LIMITATION} | Confiança molt baixa als dos models — cas ambigu |
| \`PROMPT_ISSUE\` | ${diagCounts.PROMPT_ISSUE} | Possiblement prompt no prou específic per al cas |

`

// Preguntes descartades pel router
if (skippedByRouter.length > 0) {
  md += `## Preguntes descartades pel router (no analitzades)\n\n`
  md += `| Student | Q | OCR | Raó |\n|---|---|---|---|\n`
  for (const s of skippedByRouter) {
    md += `| ${s.student_id} | ${s.question_id} | \`${s.ocr_status}\` | ${escMd(s.reason.slice(0, 80))} |\n`
  }
  md += `\n---\n\n`
}

// Detall per pregunta
md += `## Detall per pregunta (canal \`text\`)\n\n`

for (const row of allRows) {
  const matchStr = row.verdict_match ? '✓ acord' : `⚠ discrepància`
  md += `### ${row.student_id} — ${row.question_id} [ocr: \`${row.ocr_status}\`] ${matchStr}\n\n`
  md += `**Pregunta:** ${escMd(row.question_text)}\n\n`
  md += `**Router:** ${escMd(row.routing_reason)}\n\n`

  const answerDisplay = row.answer_text.trim()
  if (answerDisplay) {
    md += `**Resposta (OCR):**\n\`\`\`\n${truncate(answerDisplay, 400)}\n\`\`\`\n\n`
  }

  md += `| | gpt-5.4 | claude-sonnet-4-6 |\n|---|---|---|\n`
  md += `| **Verdict** | ${verdictIcon(row.gpt.verdict)} | ${verdictIcon(row.claude.verdict)} |\n`
  md += `| **Confidence** | ${row.gpt.confidence?.toFixed(2) ?? '—'} | ${row.claude.confidence?.toFixed(2) ?? '—'} |\n`
  md += `| **Latència** | ${row.gpt.latencyMs}ms | ${row.claude.latencyMs}ms |\n\n`

  if (row.gpt.error) md += `> ⚠ GPT error: ${row.gpt.error}\n\n`
  if (row.claude.error) md += `> ⚠ Claude error: ${row.claude.error}\n\n`

  if (row.gpt.feedback) md += `**Feedback GPT:** ${escMd(truncate(row.gpt.feedback, 300))}\n\n`
  if (row.claude.feedback)
    md += `**Feedback Claude:** ${escMd(truncate(row.claude.feedback, 300))}\n\n`

  if (!row.verdict_match && row.discrepancy_class && row.diagnostic) {
    md += `> ⚠ **Discrepància** — Classificació: \`${row.discrepancy_class}\` | Diagnòstic: \`${row.diagnostic}\`\n\n`
  }

  md += `---\n\n`
}

// Discrepàncies resumides
if (discrepancies.length > 0) {
  md += `## Resum de discrepàncies\n\n`
  md += `| Student | Q | OCR | GPT | Claude | Classif. | Diagn. |\n|---|---|---|---|---|---|---|\n`
  for (const r of discrepancies) {
    md += `| ${r.student_id} | ${r.question_id} | \`${r.ocr_status}\` | ${r.gpt.verdict ?? '—'} | ${r.claude.verdict ?? '—'} | \`${r.discrepancy_class ?? '—'}\` | \`${r.diagnostic ?? '—'}\` |\n`
  }
  md += `\n---\n\n`
}

// Diagnòstic qualitatiu
md += `## Diagnòstic qualitatiu

### A. El router està ben calibrat?

`
if (discrepancies.filter((r) => r.diagnostic === 'ROUTER_TOO_PERMISSIVE').length > 0) {
  md += `**Parcialment.** Hi ha ${diagCounts.ROUTER_TOO_PERMISSIVE} cas(os) on el router ha deixat passar text que hauria d'haver filtrat (\`ROUTER_TOO_PERMISSIVE\`). Considerar reduir \`MAX_NOISE_RATIO\` o augmentar \`MIN_TEXT_LENGTH\`.\n\n`
} else {
  md += `**Sí.** Cap cas classificat com \`ROUTER_TOO_PERMISSIVE\`. Els criteris de filtrat (MIN_TEXT_LENGTH=${15}, MAX_NOISE_RATIO=60%) funcionen correctament.\n\n`
}

md += `### B. El grading és estable?

`
if (concordance >= 60) {
  md += `**Sí.** Concordança del ${concordance}% — els dos models convergeixen en la majoria de casos del canal \`text\`.\n\n`
} else {
  md += `**No prou.** Concordança del ${concordance}% — massa variabilitat entre models. Probable causa: ${diagCounts.OCR_TOO_NOISY_FOR_TEXT > diagCounts.GRADER_LIMITATION ? 'soroll OCR residual que ha passat el filtre' : 'limitació dels models per a casos ambigus'}.\n\n`
}

md += `### C. Hi ha falsos \`text\`?

`
const falsosText = discrepancies.filter(
  (r) => r.diagnostic === 'ROUTER_TOO_PERMISSIVE' || r.diagnostic === 'OCR_TOO_NOISY_FOR_TEXT',
).length
if (falsosText > 0) {
  md += `**Sí, ${falsosText} cas(os).** Preguntes que han passat el router però que mostren indicis clars de soroll OCR excessiu (els models no poden llegir bé el text). Diagnosticats com \`ROUTER_TOO_PERMISSIVE\` o \`OCR_TOO_NOISY_FOR_TEXT\`.\n\n`
} else {
  md += `**No.** Cap cas detectat on el text sembli massa sorollós per al canal text. El filtre del router sembla adequat.\n\n`
}

md += `---

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
    discrepancy_class: r.discrepancy_class,
    diagnostic: r.diagnostic,
  })),
  null,
  2,
)}
\`\`\`
`

// ── Escriptura ────────────────────────────────────────────────────────────────

const outPath = resolve(process.cwd(), '../../docs/spikes/spike-3d-text-channel-validation.md')
writeFileSync(outPath, md, 'utf8')
console.error(`\n✅ Report escrit a ${outPath}`)

// ── Resum a stdout ────────────────────────────────────────────────────────────

const SEP = '='.repeat(60)
console.log('\n' + SEP)
console.log('SPIKE 3.D — Validació canal text')
console.log(SEP)
console.log(`Preguntes analitzades (route=text): ${total}`)
console.log(`Descartades pel router:             ${skippedByRouter.length}`)
console.log(`Concordança GPT vs Claude:          ${concordance}% (${matches}/${total})`)
console.log(`Confiança GPT avg:                  ${avgGptConf}`)
console.log(`Confiança Claude avg:               ${avgClaudeConf}`)
console.log(`Casos dubtosos (conf<0.4 ambdós):   ${lowConfPct}% (${lowConfCount}/${total})`)
console.log(`Discrepàncies:                      ${discrepancies.length}`)
if (discrepancies.length > 0) {
  console.log(`  ROUTER_TOO_PERMISSIVE: ${diagCounts.ROUTER_TOO_PERMISSIVE}`)
  console.log(`  OCR_TOO_NOISY_FOR_TEXT: ${diagCounts.OCR_TOO_NOISY_FOR_TEXT}`)
  console.log(`  GRADER_LIMITATION: ${diagCounts.GRADER_LIMITATION}`)
  console.log(`  PROMPT_ISSUE: ${diagCounts.PROMPT_ISSUE}`)
}
console.log(SEP)
console.log(`Canal text: ${routerStatus.replace(/\*\*/g, '')}`)
console.log(SEP)
console.log(`Report: docs/spikes/spike-3d-text-channel-validation.md`)
