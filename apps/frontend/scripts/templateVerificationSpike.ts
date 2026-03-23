/**
 * Harness: verificació de correspondència scan ↔ template.
 *
 * Ús (des de apps/frontend):
 *   npm run spike:template-verification
 *
 * Llegeix el template real de: tests/fixtures/template-anchor/template_hospital_daw.json
 * Processa: ex_alumne1.pdf (s'espera NO MATCH), ex_alumne2–4.pdf (s'espera MATCH)
 * Sortida: resultat de verificació per cada PDF (is_match, confidence, reason, detalls).
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { rasterizePdfToPngPages } from '../src/infrastructure/ocr/rasterizePdfToPngPages'
import { ocrPngBuffersWithTesseract } from '../src/infrastructure/ocr/tesseractOcrPng'
import { detectTemplateQuestionAnchors } from '../src/features/template-anchor-detection/detectTemplateQuestionAnchors'
import { verifyScanMatchesTemplate } from '../src/features/template-verification/verifyScanMatchesTemplate'
import type { TemplateQuestion } from '../src/features/template-anchor-detection/types'

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

  const ocrPagesFlat = pages.map((p, i) => ({
    pageIndex: p.pageIndex,
    text: ocrTexts[i] ?? '',
  }))

  const { detected, not_found } = detectTemplateQuestionAnchors(TEMPLATE_QUESTIONS, ocrPagesFlat)
  const verification = verifyScanMatchesTemplate(TEMPLATE_QUESTIONS, detected, not_found)

  const matchLabel = verification.is_match ? '✅ MATCH' : '❌ NO MATCH'
  console.log(`\n### ${pdfName} → ${matchLabel}`)
  console.log(`  Confidence: ${verification.confidence} | Reason: ${verification.reason}`)
  console.log(
    `  Anchors: ${verification.detected_anchor_count}/${verification.expected_question_count}`,
  )
  if (verification.missing_question_ids.length > 0) {
    console.log(`  Missing: ${verification.missing_question_ids.join(', ')}`)
  }
  if (verification.matched_question_ids.length > 0) {
    const avgSim = detected.reduce((s, a) => s + a.similarity, 0) / detected.length
    console.log(`  Avg similarity: ${avgSim.toFixed(2)}`)
  }
}

async function main(): Promise<void> {
  console.error('=== Template Verification Spike ===')
  console.error(
    `Template: ${templateJson.source ?? TEMPLATE_PATH} (${TEMPLATE_QUESTIONS.length} preguntes)`,
  )
  console.error('\nExpectat: alumne1 → NO MATCH | alumne2–4 → MATCH\n')

  for (const pdf of PDFS) {
    await processPdf(pdf)
  }

  console.log('\n---')
  console.log('Regla aplicada:')
  console.log('  - rati ≥ 60% + avg_sim ≥ 0.55 → MATCH (enough_anchors_detected)')
  console.log('  - rati ≥ 60% + avg_sim < 0.55 → NO MATCH (ocr_too_noisy)')
  console.log('  - rati 30–60%                  → NO MATCH (too_few_anchors)')
  console.log('  - rati < 30%                   → NO MATCH (wrong_exam)')
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
