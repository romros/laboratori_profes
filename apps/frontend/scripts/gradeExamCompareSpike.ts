/**
 * Harness de comparació Feature 3 — OpenAI (gpt-5.4) vs Claude (claude-sonnet-4-6).
 *
 * Ús (des de apps/frontend):
 *   npm run spike:grade-exam-compare
 *
 * Llegeix claus de:
 *   FEATURE0_OPENAI_API_KEY  → OpenAI
 *   CLAUDE_API_KEY           → Anthropic Claude
 *
 * Executa els dos models en paral·lel per cada pregunta.
 * Mostra resultats cara a cara per comparar criteri, feedback i confidence.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'

import { buildEvaluateAnswerPrompt } from '../src/features/answer-evaluator/services/evaluateAnswerPrompt'
import { triageAnswerEvaluability } from '../src/features/answer-evaluator/services/triageAnswerEvaluability'
import type { AssessmentSpec, QuestionSpec } from '../src/domain/assessment-spec/assessmentSpec.schema'
import type { AnswerForEvaluation } from '../src/domain/answer-evaluator/answerEvaluator.schema'
import { hospitalDawExamDocumentContext } from '../tests/fixtures/assessment-spec-builder/hospitalDawGolden'
import { callOpenAiCompatibleChat } from '../src/features/template-inference/services/openAiCompatibleChat'

const OPENAI_KEY = process.env.FEATURE0_OPENAI_API_KEY || process.env.OPENAI_API_KEY
const CLAUDE_KEY = process.env.CLAUDE_API_KEY

if (!OPENAI_KEY) { console.error('Cal FEATURE0_OPENAI_API_KEY'); process.exit(1) }
if (!CLAUDE_KEY) { console.error('Cal CLAUDE_API_KEY'); process.exit(1) }

const ENRICHED_FIXTURE = resolve(
  process.cwd(),
  'tests/fixtures/assessment-spec-builder/hospitalDawGolden.enriched-output.json',
)
const spec = JSON.parse(readFileSync(ENRICHED_FIXTURE, 'utf8')) as AssessmentSpec

const answers: AnswerForEvaluation[] = [
  {
    question_id: 'Q1',
    ocr_status: 'ok',
    answer_text: `CREATE TABLE Hospital (
  codi INT PRIMARY KEY,
  cp CHAR(5) NOT NULL,
  carrer VARCHAR(120) NOT NULL,
  numero INT NOT NULL CHECK (numero > 0),
  telefon VARCHAR(20) NOT NULL
);`,
  },
  {
    question_id: 'Q2',
    ocr_status: 'ok',
    answer_text: `CREATE TABLE Pacient (
  nif CHAR(9) PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  cognoms VARCHAR(150) NOT NULL,
  cp CHAR(5) NOT NULL,
  carrer VARCHAR(120) NOT NULL,
  numero INT NOT NULL,
  telefon VARCHAR(20) NOT NULL
);`,
  },
  {
    question_id: 'Q3',
    ocr_status: 'ok',
    answer_text: `CREATE TABLE Habitacio (
  numHabitacio INT PRIMARY KEY,
  tipus VARCHAR(20) CHECK (tipus IN ('individual', 'compartida')),
  codiHosp INT REFERENCES Hospital(codi) ON DELETE CASCADE,
  nifPacient CHAR(9) REFERENCES Pacient(nif) ON DELETE CASCADE
);`,
  },
  {
    question_id: 'Q4',
    ocr_status: 'empty',
    answer_text: '',
  },
  {
    question_id: 'Q5',
    ocr_status: 'uncertain',
    answer_text: `CREAT TABL Tractament (
  idTractament INT PRIMAR KEY,
  nomTractament VRCHAR(100),
  nifPacient CHAR(9) REFERENC Pacient(nif),
  nifMetge CHAR(9)
)`,
  },
]

const llmVerdictSchema = z.object({
  verdict: z.enum(['correct', 'partial', 'incorrect']),
  feedback: z.string(),
  confidence: z.number().min(0).max(1),
})

type GradeResult = {
  verdict: 'correct' | 'partial' | 'incorrect' | null
  feedback: string | null
  confidence: number | null
  error?: string
  latencyMs: number
}

// ---- OpenAI via callOpenAiCompatibleChat ----
async function gradeOpenAI(q: QuestionSpec, answer: AnswerForEvaluation): Promise<GradeResult> {
  const t0 = Date.now()
  const triage = triageAnswerEvaluability(answer)
  if (triage.evaluable_by_ocr === 'no') {
    return { verdict: null, feedback: null, confidence: null, latencyMs: 0 }
  }
  const userContent = buildEvaluateAnswerPrompt({
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
        { role: 'system', content: "Ets un avaluador pedagògic expert. Respon NOMÉS amb JSON vàlid, sense markdown ni text fora del JSON." },
        { role: 'user', content: userContent },
      ],
    })
    const parsed = llmVerdictSchema.parse(JSON.parse(raw.trim()))
    return { verdict: parsed.verdict, feedback: parsed.feedback, confidence: parsed.confidence, latencyMs: Date.now() - t0 }
  } catch (e) {
    return { verdict: null, feedback: null, confidence: null, error: String(e), latencyMs: Date.now() - t0 }
  }
}

// ---- Claude via Anthropic Messages API ----
async function gradeClaude(q: QuestionSpec, answer: AnswerForEvaluation): Promise<GradeResult> {
  const t0 = Date.now()
  const triage = triageAnswerEvaluability(answer)
  if (triage.evaluable_by_ocr === 'no') {
    return { verdict: null, feedback: null, confidence: null, latencyMs: 0 }
  }
  const userContent = buildEvaluateAnswerPrompt({
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
        system: "Ets un avaluador pedagògic expert. Avalues respostes d'alumnes contra un AssessmentSpec del professor. Respon NOMÉS amb JSON vàlid, sense markdown ni text fora del JSON.",
        messages: [{ role: 'user', content: userContent }],
      }),
    })
    const body = await res.json() as { content?: { type: string; text: string }[]; error?: { message: string } }
    if (!res.ok) throw new Error(body.error?.message ?? `HTTP ${res.status}`)
    const text = body.content?.find(c => c.type === 'text')?.text ?? ''
    // Claude de vegades envolta el JSON en ```json ... ```
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = llmVerdictSchema.parse(JSON.parse(cleaned))
    return { verdict: parsed.verdict, feedback: parsed.feedback, confidence: parsed.confidence, latencyMs: Date.now() - t0 }
  } catch (e) {
    return { verdict: null, feedback: null, confidence: null, error: String(e), latencyMs: Date.now() - t0 }
  }
}

// ---- execució ----
const specById = new Map(spec.questions.map(q => [q.question_id, q]))

const SEP = '='.repeat(70)
const sep = '-'.repeat(70)

console.log(SEP)
console.log('COMPARACIÓ Feature 3 — gpt-5.4  vs  claude-sonnet-4-6')
console.log(`Spec: ${spec.exam_id}  |  Alumne: alumne-compare-001`)
console.log(SEP)
console.log()

for (const answer of answers) {
  const q = specById.get(answer.question_id)!
  const triage = triageAnswerEvaluability(answer)

  console.log(`┌── ${answer.question_id}  [ocr: ${answer.ocr_status}]`)
  console.log(`│   ${q.question_text}`)

  if (triage.evaluable_by_ocr === 'no') {
    console.log(`│   → no avaluable (${triage.evaluability_reason})`)
    console.log(`└${'─'.repeat(69)}`)
    console.log()
    continue
  }

  // execució paral·lela
  const [openai, claude] = await Promise.all([
    gradeOpenAI(q, answer),
    gradeClaude(q, answer),
  ])

  const verdictIcon = (v: string | null) =>
    v === 'correct' ? '✅' : v === 'partial' ? '🟡' : v === 'incorrect' ? '❌' : '—'

  console.log(`│`)
  console.log(`│   ┌─ gpt-5.4 (${openai.latencyMs}ms)`)
  console.log(`│   │  verdict: ${verdictIcon(openai.verdict)} ${openai.verdict ?? '—'}  confidence: ${openai.confidence?.toFixed(2) ?? '—'}`)
  console.log(`│   │  feedback: ${openai.error ? '⚠ ' + openai.error : openai.feedback}`)
  console.log(`│   │`)
  console.log(`│   └─ claude-sonnet-4-6 (${claude.latencyMs}ms)`)
  console.log(`│      verdict: ${verdictIcon(claude.verdict)} ${claude.verdict ?? '—'}  confidence: ${claude.confidence?.toFixed(2) ?? '—'}`)
  console.log(`│      feedback: ${claude.error ? '⚠ ' + claude.error : claude.feedback}`)
  console.log(`│`)

  // discrepàncies
  if (openai.verdict !== claude.verdict) {
    console.log(`│   ⚠  DISCREPÀNCIA DE VEREDICTE: ${openai.verdict} vs ${claude.verdict}`)
  }

  console.log(`└${'─'.repeat(69)}`)
  console.log()
}

console.log(SEP)
console.log('FI COMPARACIÓ')
console.log(SEP)
