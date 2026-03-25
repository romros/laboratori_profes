/**
 * Harness E2E — Integration Feature 4 + Feature 3.
 *
 * Usa gradeExamFromPdf per executar el pipeline complet:
 *   PDF → OCR (PaddleVL) → mapping → grading
 *
 * Prerequisit:
 *   llama-server en marxa:
 *     cd apps/ocr-fallback && docker compose -f docker-compose.vl-gguf.yml up -d vl-server
 *
 * Ús (des de apps/frontend):
 *   npm run spike:grade-exam-full-pipeline
 *
 * Variables d'entorn:
 *   ASSESSMENT_SPEC_OPENAI_API_KEY  (o OPENAI_API_KEY / FEATURE0_OPENAI_API_KEY)
 *     → sense clau: mapping-only (no crash)
 *   VL_SERVER_URL   URL del llama-server (default: http://localhost:8111/v1)
 *   EXAM_PDF        Ruta al PDF de l'alumne (default: ../../data/ex_alumne2.pdf)
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { gradeExamFromPdf } from '../src/features/grading/gradeExamFromPdf'
import type { TemplateQuestion } from '../src/features/template-anchor-detection/types'
import type { AssessmentSpec } from '../src/domain/assessment-spec/assessmentSpec.schema'
import { hospitalDawExamDocumentContext } from '../tests/fixtures/assessment-spec-builder/hospitalDawGolden'

// ─── Configuració ─────────────────────────────────────────────────────────────

const API_KEY =
  process.env['ASSESSMENT_SPEC_OPENAI_API_KEY'] ??
  process.env['OPENAI_API_KEY'] ??
  process.env['FEATURE0_OPENAI_API_KEY']

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

for (const [label, path] of [
  ['PDF', PDF_PATH],
  ['Template', TEMPLATE_PATH],
  ['AssessmentSpec', ENRICHED_FIXTURE],
] as [string, string][]) {
  if (!existsSync(path)) {
    console.error(`${label} no trobat: ${path}`)
    process.exit(1)
  }
}

// ─── Càrrega ──────────────────────────────────────────────────────────────────

const templateJson = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf8')) as {
  source?: string
  questions: TemplateQuestion[]
}
const spec = JSON.parse(readFileSync(ENRICHED_FIXTURE, 'utf8')) as AssessmentSpec
const pdfBuffer = readFileSync(PDF_PATH)

// ─── Execució ─────────────────────────────────────────────────────────────────

console.log('='.repeat(70))
console.log('INTEGRATION E2E — Feature 4 + Feature 3')
console.log(`  PDF:      ${PDF_PATH}`)
console.log(`  Template: ${templateJson.source ?? TEMPLATE_PATH}`)
console.log(`  Spec:     ${spec.exam_id} (${spec.questions.length} preguntes)`)
console.log(`  Mode:     ${API_KEY ? 'complet (grading + OCR)' : 'mapping-only (sense API key)'}`)
console.log('='.repeat(70))

if (!API_KEY) {
  console.warn(
    '\n[AVÍS] Sense API key → mode mapping-only. Afegeix ASSESSMENT_SPEC_OPENAI_API_KEY per al grading complet.\n',
  )
}

let pageCount = 0

const result = await gradeExamFromPdf(pdfBuffer, templateJson.questions, spec, API_KEY, {
  ocrServerUrl: process.env['VL_SERVER_URL'],
  studentId: 'e2e-alumne',
  examDocumentContext: hospitalDawExamDocumentContext,
  onOcrProgress: (i, total) => {
    pageCount = total
    process.stdout.write(`  [OCR] pàgina ${i + 1}/${total}\r`)
  },
})

if (pageCount > 0) process.stdout.write('\n')

// ─── Resultats ────────────────────────────────────────────────────────────────

const { timing, mapping, grading, mapping_only } = result
const detected = mapping.questions.filter((q) => q.is_detected)

console.log('\n' + '='.repeat(70))
console.log('MAPPING')
console.log('='.repeat(70))
console.log(`  is_match:    ${mapping.is_match}`)
console.log(`  confidence:  ${mapping.confidence.toFixed(2)}`)
console.log(`  reason:      ${mapping.reason}`)
console.log(`  detectades:  ${detected.length}/${mapping.questions.length}`)

for (const q of mapping.questions) {
  if (!q.is_detected) {
    console.log(`  [${q.question_id}] ❌ no detectada`)
    continue
  }
  const warnStr = q.warnings.length > 0 ? ` ⚠️[${q.warnings.join(',')}]` : ''
  const preview = q.answer_text_clean.split('\n').slice(0, 2).join(' | ').slice(0, 100)
  console.log(`  [${q.question_id}] sim=${q.match.similarity.toFixed(2)}${warnStr}`)
  if (preview) console.log(`    → ${preview}`)
}

if (!mapping_only && grading) {
  console.log('\n' + '='.repeat(70))
  console.log('GRADING')
  console.log('='.repeat(70))

  for (const qr of grading.question_results) {
    if (qr.verdict !== null) {
      const icon = qr.verdict === 'correct' ? '✅' : qr.verdict === 'partial' ? '⚠️' : '❌'
      console.log(`  [${qr.question_id}] ${icon} ${qr.verdict} (conf=${qr.confidence?.toFixed(2)})`)
      if (qr.feedback) console.log(`    ${qr.feedback.slice(0, 120)}`)
    } else {
      console.log(`  [${qr.question_id}] — no avaluat: ${qr.evaluability_reason.slice(0, 60)}`)
    }
  }

  const graded = grading.question_results.filter((q) => q.verdict !== null)
  const correct = graded.filter((q) => q.verdict === 'correct').length
  const partial = graded.filter((q) => q.verdict === 'partial').length
  const incorrect = graded.filter((q) => q.verdict === 'incorrect').length

  console.log('\n' + '─'.repeat(70))
  console.log(`  Avaluades:    ${graded.length}/${grading.question_results.length}`)
  console.log(`  ✅ Correctes: ${correct}`)
  console.log(`  ⚠️  Parcials: ${partial}`)
  console.log(`  ❌ Incorrectes: ${incorrect}`)
}

console.log('\n' + '='.repeat(70))
console.log('TEMPS')
console.log('='.repeat(70))
console.log(`  Rasterització: ${timing.rasterize_ms}ms`)
console.log(
  `  OCR (PaddleVL): ${(timing.ocr_ms / 1000).toFixed(1)}s (${pageCount > 0 ? (timing.ocr_ms / pageCount / 1000).toFixed(1) : '?'}s/pàg)`,
)
console.log(`  Mapping:       ${timing.mapping_ms}ms`)
if (!mapping_only) console.log(`  Grading (LLM): ${(timing.grading_ms / 1000).toFixed(1)}s`)
console.log(`  TOTAL:         ${(timing.total_ms / 1000).toFixed(1)}s`)
console.log('='.repeat(70))
