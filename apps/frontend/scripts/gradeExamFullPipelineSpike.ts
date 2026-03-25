/**
 * Spike D — Pipeline complet: PDF → OCR (PaddleVL) → buildTemplateMappedAnswers → gradeExam
 *
 * Primer test real del sistema integrat (Feature 4 + Feature 3).
 * Mesura: % preguntes correctament corregides, temps total per examen.
 *
 * Prerequisit:
 *   llama-server en marxa:
 *     cd apps/ocr-fallback && docker compose -f docker-compose.vl-gguf.yml up -d vl-server
 *
 * Ús (des de apps/frontend):
 *   ASSESSMENT_SPEC_OPENAI_API_KEY=sk-... npm run spike:grade-exam-full-pipeline
 *
 * Variables d'entorn opcionals:
 *   VL_SERVER_URL   URL del llama-server (default: http://localhost:8111/v1)
 *   EXAM_PDF        Ruta al PDF de l'alumne (default: ../../data/ex_alumne2.pdf)
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { rasterizePdfToPngPages } from '../src/infrastructure/ocr/rasterizePdfToPngPages'
import { ocrPngBuffersWithPaddleVl } from '../src/infrastructure/ocr/paddleVlOcrClient'
import { buildTemplateMappedAnswers } from '../src/features/template-answer-zones/services/buildTemplateMappedAnswers'
import { gradeExam } from '../src/features/answer-evaluator/services/gradeExam'
import type { TemplateQuestion } from '../src/features/template-anchor-detection/types'
import type { OcrPageLines } from '../src/features/template-answer-zones/types'
import type { AnswerForEvaluation } from '../src/domain/answer-evaluator/answerEvaluator.schema'
import type { AssessmentSpec } from '../src/domain/assessment-spec/assessmentSpec.schema'
import { hospitalDawExamDocumentContext } from '../tests/fixtures/assessment-spec-builder/hospitalDawGolden'

// ─── Configuració ─────────────────────────────────────────────────────────────

const API_KEY =
  process.env['ASSESSMENT_SPEC_OPENAI_API_KEY'] ??
  process.env['OPENAI_API_KEY'] ??
  process.env['FEATURE0_OPENAI_API_KEY']

const MAPPING_ONLY = !API_KEY

if (MAPPING_ONLY) {
  console.warn(
    "[AVÍS] Cap API key detectada. S'executa en mode mapping-only (pas 1-3, sense gradeExam).",
  )
}

const TEMPLATE_PATH = resolve(
  process.cwd(),
  'tests/fixtures/template-anchor/template_hospital_daw.json',
)

const ENRICHED_FIXTURE = resolve(
  process.cwd(),
  'tests/fixtures/assessment-spec-builder/hospitalDawGolden.enriched-output.json',
)

const PDF_PATH = process.env['EXAM_PDF']
  ? resolve(process.env['EXAM_PDF'])
  : resolve(process.cwd(), '../../data/ex_alumne2.pdf')

// ─── Validació d'entorn ────────────────────────────────────────────────────────

if (!existsSync(PDF_PATH)) {
  console.error(`PDF no trobat: ${PDF_PATH}`)
  process.exit(1)
}

if (!existsSync(TEMPLATE_PATH)) {
  console.error(`Template no trobat: ${TEMPLATE_PATH}`)
  process.exit(1)
}

if (!existsSync(ENRICHED_FIXTURE)) {
  console.error(`AssessmentSpec no trobada: ${ENRICHED_FIXTURE}`)
  process.exit(1)
}

// ─── Càrrega de dades estàtiques ──────────────────────────────────────────────

const templateJson = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf8')) as {
  source?: string
  questions: TemplateQuestion[]
}
const TEMPLATE_QUESTIONS = templateJson.questions

const spec = JSON.parse(readFileSync(ENRICHED_FIXTURE, 'utf8')) as AssessmentSpec

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mapeja TemplateMappedAnswer → AnswerForEvaluation per al grader. */
function toAnswerForEvaluation(q: {
  question_id: string
  is_detected: boolean
  answer_text_clean: string
  warnings: string[]
}): AnswerForEvaluation {
  if (!q.is_detected) {
    return { question_id: q.question_id, answer_text: '', ocr_status: 'not_detected' }
  }
  if (!q.answer_text_clean || q.answer_text_clean.trim().length === 0) {
    return { question_id: q.question_id, answer_text: '', ocr_status: 'empty' }
  }
  // Si hi ha warning de low_similarity → uncertain
  const ocr_status = q.warnings.includes('low_similarity')
    ? ('uncertain' as const)
    : ('ok' as const)
  return { question_id: q.question_id, answer_text: q.answer_text_clean, ocr_status }
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

const t0_total = Date.now()

console.log('='.repeat(70))
console.log('SPIKE D — Pipeline complet: PDF → OCR (PaddleVL) → Grade')
console.log(`  PDF:      ${PDF_PATH}`)
console.log(`  Template: ${templateJson.source ?? TEMPLATE_PATH}`)
console.log(`  Spec:     ${spec.exam_id} (${spec.questions.length} preguntes)`)
console.log('='.repeat(70))

// ── Pas 1: Rasterització ─────────────────────────────────────────────────────
console.log('\n[1/4] Rasteritzant PDF…')
const t0_raster = Date.now()
const pdfBuffer = readFileSync(PDF_PATH)
const pages = await rasterizePdfToPngPages(pdfBuffer)
const pngs = pages.map((p) => p.png)
console.log(`  ${pages.length} pàgines rasteritzades en ${Date.now() - t0_raster}ms`)

// ── Pas 2: OCR via PaddleVL ───────────────────────────────────────────────────
console.log('\n[2/4] OCR via PaddleOCR-VL (llama-server)…')
console.log(`  Servidor: ${process.env['VL_SERVER_URL'] ?? 'http://localhost:8111/v1'}`)
console.log(`  Nota: ~15s/pàgina. Total estimat: ~${pages.length * 15}s`)

const t0_ocr = Date.now()
const ocrTexts = await ocrPngBuffersWithPaddleVl(pngs, {
  onProgress: (i, total) => {
    console.log(`  Pàgina ${i + 1}/${total}…`)
  },
})
const elapsed_ocr = Date.now() - t0_ocr
console.log(
  `  OCR completat en ${(elapsed_ocr / 1000).toFixed(1)}s (${(elapsed_ocr / pages.length / 1000).toFixed(1)}s/pàg)`,
)

const ocrPages: OcrPageLines[] = pages.map((p, i) => ({
  pageIndex: p.pageIndex,
  lines: (ocrTexts[i] ?? '').split('\n'),
}))

// Mostra resum OCR per pàgina
for (const p of ocrPages) {
  const nonEmpty = p.lines.filter((l) => l.trim().length > 0).length
  console.log(`  pàg.${p.pageIndex}: ${p.lines.length} línies (${nonEmpty} no buides)`)
}

// ── Pas 3: buildTemplateMappedAnswers ─────────────────────────────────────────
console.log('\n[3/4] Mapping template → respostes…')
const t0_map = Date.now()
const mappedResult = buildTemplateMappedAnswers(TEMPLATE_QUESTIONS, ocrPages)
console.log(`  Mapping completat en ${Date.now() - t0_map}ms`)
console.log(
  `  is_match: ${mappedResult.is_match} | confidence: ${mappedResult.confidence.toFixed(2)} | reason: ${mappedResult.reason}`,
)

const detected = mappedResult.questions.filter((q) => q.is_detected)
console.log(`  Detectades: ${detected.length}/${mappedResult.questions.length}`)

// Mostra text per pregunta
console.log('\n  --- Respostes detectades ---')
for (const q of mappedResult.questions) {
  if (!q.is_detected) {
    console.log(`  [${q.question_id}] ❌ no detectada`)
    continue
  }
  const preview = q.answer_text_clean.split('\n').slice(0, 2).join(' | ').slice(0, 120)
  const warnStr = q.warnings.length > 0 ? ` ⚠️[${q.warnings.join(',')}]` : ''
  console.log(`  [${q.question_id}] sim=${q.match.similarity.toFixed(2)}${warnStr}`)
  if (preview) console.log(`    → ${preview}`)
}

// ── Pas 4: gradeExam ──────────────────────────────────────────────────────────
if (MAPPING_ONLY) {
  console.log('\n[4/4] Grading OMÈS (mode mapping-only, sense API key).')
  console.log('\n' + '='.repeat(70))
  console.log('RESULTATS (mapping-only)')
  console.log('='.repeat(70))
  console.log(`  OCR detectades:  ${detected.length}/${mappedResult.questions.length}`)
  console.log(`  is_match:        ${mappedResult.is_match}`)
  console.log(`  confidence:      ${mappedResult.confidence.toFixed(2)}`)
  console.log(`  TOTAL:           ${((Date.now() - t0_total) / 1000).toFixed(1)}s`)
  console.log('='.repeat(70))
  process.exit(0)
}
console.log('\n[4/4] Avaluant respostes (gradeExam + LLM)…')

const answers: AnswerForEvaluation[] = mappedResult.questions.map(toAnswerForEvaluation)

console.log(`  Total respostes → grader: ${answers.length}`)
console.log(`  ok: ${answers.filter((a) => a.ocr_status === 'ok').length}`)
console.log(`  uncertain: ${answers.filter((a) => a.ocr_status === 'uncertain').length}`)
console.log(`  empty: ${answers.filter((a) => a.ocr_status === 'empty').length}`)
console.log(`  not_detected: ${answers.filter((a) => a.ocr_status === 'not_detected').length}`)

const t0_grade = Date.now()
const gradeResult = await gradeExam({
  student_id: 'spike-d-alumne',
  assessment_spec: spec,
  answers,
  exam_document_context: hospitalDawExamDocumentContext,
  apiKey: API_KEY,
})
const elapsed_grade = Date.now() - t0_grade
console.log(`  Grading completat en ${(elapsed_grade / 1000).toFixed(1)}s`)

// ─── Resultats finals ─────────────────────────────────────────────────────────
const elapsed_total = Date.now() - t0_total

console.log('\n' + '='.repeat(70))
console.log('RESULTATS')
console.log('='.repeat(70))

for (const qr of gradeResult.question_results) {
  const ocrInfo = answers.find((a) => a.question_id === qr.question_id)
  const ocrStatus = ocrInfo?.ocr_status ?? '?'
  if (qr.verdict !== null) {
    const icon = qr.verdict === 'correct' ? '✅' : qr.verdict === 'partial' ? '⚠️' : '❌'
    console.log(
      `  [${qr.question_id}] ${icon} ${qr.verdict} (conf=${qr.confidence?.toFixed(2)}) [ocr=${ocrStatus}]`,
    )
    if (qr.feedback) console.log(`    feedback: ${qr.feedback.slice(0, 100)}`)
  } else {
    console.log(
      `  [${qr.question_id}] — no avaluat (${qr.evaluability_reason.slice(0, 60)}) [ocr=${ocrStatus}]`,
    )
  }
}

const graded = gradeResult.question_results.filter((q) => q.verdict !== null)
const correct = graded.filter((q) => q.verdict === 'correct').length
const partial = graded.filter((q) => q.verdict === 'partial').length
const incorrect = graded.filter((q) => q.verdict === 'incorrect').length
const notEvaluated = gradeResult.question_results.filter((q) => q.verdict === null).length

console.log('\n' + '─'.repeat(70))
console.log('RESUM')
console.log(`  Total preguntes:    ${gradeResult.question_results.length}`)
console.log(`  Avaluades (LLM):    ${graded.length}`)
console.log(`  No avaluades:       ${notEvaluated}`)
console.log(`  ✅ Correctes:       ${correct}`)
console.log(`  ⚠️  Parcials:       ${partial}`)
console.log(`  ❌ Incorrectes:     ${incorrect}`)
console.log(`  OCR detectades:     ${detected.length}/${mappedResult.questions.length}`)
console.log('\nTEMPS')
console.log(
  `  Rasterització:      ${((Date.now() - t0_total - elapsed_ocr - elapsed_grade) / 1000).toFixed(1)}s`,
)
console.log(
  `  OCR (PaddleVL):     ${(elapsed_ocr / 1000).toFixed(1)}s (${(elapsed_ocr / pages.length / 1000).toFixed(1)}s/pàg)`,
)
console.log(`  Grading (LLM):      ${(elapsed_grade / 1000).toFixed(1)}s`)
console.log(`  TOTAL:              ${(elapsed_total / 1000).toFixed(1)}s`)
console.log('='.repeat(70))
