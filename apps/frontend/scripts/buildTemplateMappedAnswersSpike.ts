/**
 * Harness: contracte de sortida "template-mapped answers" amb 4 PDFs reals.
 *
 * Ús (des de apps/frontend):
 *   npm run spike:template-mapped-answers
 *
 * Llegeix el template: tests/fixtures/template-anchor/template_hospital_daw.json
 * Processa: ex_alumne1–4.pdf
 * Expectativa:
 *   - alumne1 → is_match: false (examen diferent)
 *   - alumne2 → 15/15 detectades
 *   - alumne3 → ~14/15 detectades
 *   - alumne4 → ≥13/15 detectades
 *
 * Sortida:
 *   - Resum global per cada PDF
 *   - Primers 200 chars de answer_text_clean per pregunta detectada
 *   - Warnings detectats
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { rasterizePdfToPngPages } from '../src/infrastructure/ocr/rasterizePdfToPngPages'
import { ocrPngBuffersWithTesseract } from '../src/infrastructure/ocr/tesseractOcrPng'
import { buildTemplateMappedAnswers } from '../src/features/template-answer-zones/services/buildTemplateMappedAnswers'
import type { TemplateQuestion } from '../src/features/template-anchor-detection/types'
import type { OcrPageLines } from '../src/features/template-answer-zones/types'

const TEMPLATE_PATH = resolve(
  process.cwd(),
  'tests/fixtures/template-anchor/template_hospital_daw.json',
)
const DATA_DIR = resolve(process.cwd(), '../../data')
const PDFS = ['ex_alumne1.pdf', 'ex_alumne2.pdf', 'ex_alumne3.pdf', 'ex_alumne4.pdf']

const templateJson = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf8')) as {
  source?: string
  questions: TemplateQuestion[]
}
const TEMPLATE_QUESTIONS = templateJson.questions

async function processPdf(pdfName: string): Promise<void> {
  const pdfPath = resolve(DATA_DIR, pdfName)
  if (!existsSync(pdfPath)) {
    console.log(`SKIP ${pdfName} — no trobat`)
    return
  }

  console.error(`\nProcessant ${pdfName}…`)
  const pdfBuffer = readFileSync(pdfPath)
  const pages = await rasterizePdfToPngPages(pdfBuffer)
  const pngs = pages.map((p) => p.png)
  const ocrTexts = await ocrPngBuffersWithTesseract(pngs)

  const ocrPages: OcrPageLines[] = pages.map((p, i) => ({
    pageIndex: p.pageIndex,
    lines: (ocrTexts[i] ?? '').split('\n'),
  }))

  const result = buildTemplateMappedAnswers(TEMPLATE_QUESTIONS, ocrPages)

  const matchLabel = result.is_match ? '✅ MATCH' : '❌ NO MATCH'
  const detected = result.questions.filter((q) => q.is_detected)
  const total = result.questions.length

  console.log(`\n${'='.repeat(60)}`)
  console.log(`### ${pdfName} → ${matchLabel}`)
  console.log(`  Confidence: ${result.confidence} | Reason: ${result.reason}`)
  console.log(`  Detectades: ${detected.length}/${total}`)

  const allWarnings = result.questions.flatMap((q) =>
    q.warnings.map((w) => `${q.question_id}:${w}`),
  )
  if (allWarnings.length > 0) {
    console.log(`  Warnings: ${allWarnings.join(', ')}`)
  }

  console.log('\n  --- Respostes per pregunta ---')
  for (const q of result.questions) {
    if (!q.is_detected) {
      console.log(`  [${q.question_id}] ❌ no detectada`)
      continue
    }
    const rawLines = q.answer_text_raw.split('\n').filter((l) => l.trim())
    const cleanLines = q.answer_text_clean.split('\n').filter((l) => l.trim())
    const removed = rawLines.length - cleanLines.length
    const preview = cleanLines.slice(0, 3).join(' | ')
    const warnStr = q.warnings.length > 0 ? ` ⚠️ [${q.warnings.join(',')}]` : ''
    const cleanStr = removed > 0 ? ` (🧹 -${removed}L)` : ''
    console.log(`  [${q.question_id}] sim=${q.match.similarity.toFixed(2)}${warnStr}${cleanStr}`)
    if (preview) console.log(`    → ${preview.slice(0, 150)}`)
  }
}

async function main(): Promise<void> {
  console.error('=== Template Mapped Answers Spike ===')
  console.error(
    `Template: ${templateJson.source ?? TEMPLATE_PATH} (${TEMPLATE_QUESTIONS.length} preguntes)`,
  )

  for (const pdf of PDFS) {
    await processPdf(pdf)
  }

  console.log('\n')
  console.log('Contracte: buildTemplateMappedAnswers(templateQuestions, ocrPages)')
  console.log('Output: TemplateMappedAnswersResult { is_match, confidence, reason, questions[] }')
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
