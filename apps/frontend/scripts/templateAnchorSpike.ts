/**
 * Harness: detecta enunciats del template dins dels 4 PDFs d'alumne.
 *
 * Template llegit de: tests/fixtures/template-anchor/template_hospital_daw.json
 * Ús (des de apps/frontend):
 *   npm run spike:template-anchor
 *   npm run spike:template-anchor -- path/al/template.json
 *
 * Sortida: resum per PDF amb preguntes detectades, scores i not_found.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { rasterizePdfToPngPages } from '../src/infrastructure/ocr/rasterizePdfToPngPages'
import { ocrPngBuffersWithTesseract } from '../src/infrastructure/ocr/tesseractOcrPng'
import { detectTemplateQuestionAnchors } from '../src/features/template-anchor-detection/detectTemplateQuestionAnchors'
import type { TemplateQuestion } from '../src/features/template-anchor-detection/types'

// ---------------------------------------------------------------------------
// Template — llegit de JSON
// ---------------------------------------------------------------------------

const DEFAULT_TEMPLATE = resolve(
  process.cwd(),
  'tests/fixtures/template-anchor/template_hospital_daw.json',
)
const templatePath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : DEFAULT_TEMPLATE

if (!existsSync(templatePath)) {
  console.error(`No s'ha trobat el template: ${templatePath}`)
  process.exit(1)
}

const templateJson = JSON.parse(readFileSync(templatePath, 'utf8')) as {
  source?: string
  questions: TemplateQuestion[]
}
const TEMPLATE_QUESTIONS: TemplateQuestion[] = templateJson.questions
console.error(
  `Template: ${templateJson.source ?? templatePath} (${TEMPLATE_QUESTIONS.length} preguntes)`,
)

// ---------------------------------------------------------------------------
// PDFs
// ---------------------------------------------------------------------------

const DATA_DIR = resolve(process.cwd(), '../../data')
const PDFS = ['ex_alumne1.pdf', 'ex_alumne2.pdf', 'ex_alumne3.pdf', 'ex_alumne4.pdf']

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

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

  const ocrPages = pages.map((p, i) => ({
    pageIndex: p.pageIndex,
    text: ocrTexts[i] ?? '',
  }))

  const result = detectTemplateQuestionAnchors(TEMPLATE_QUESTIONS, ocrPages)

  console.log(`\n### ${pdfName}`)
  console.log(
    `Detectades: ${result.detected.length}/${TEMPLATE_QUESTIONS.length} (${Math.round((result.detected.length / TEMPLATE_QUESTIONS.length) * 100)}%)`,
  )
  console.log(`No trobades: ${result.not_found.join(', ') || '—'}`)
  console.log()
  console.log('Matches:')
  for (const d of result.detected) {
    console.log(
      `  ${d.question_id} [p${d.page_index}] score=${d.similarity} | "${d.matched_text.slice(0, 80)}"`,
    )
  }
}

async function main(): Promise<void> {
  console.error('=== Template Anchor Detection — Spike ===')
  console.error(`Template: ${TEMPLATE_QUESTIONS.length} preguntes`)

  for (const pdf of PDFS) {
    await processPdf(pdf)
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
