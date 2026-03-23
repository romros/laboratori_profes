/**
 * Harness: detecta enunciats del template dins dels 4 PDFs d'alumne.
 *
 * Template hardcoded (basat en les preguntes observades als PDFs reals).
 * Ús (des de apps/frontend):
 *   npm run spike:template-anchor
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
// Template mock (enunciats del professor — lletra d'impremta)
// Basat en els exàmens reals observats (SQL/BD, examen de creació de taules)
// ---------------------------------------------------------------------------

const TEMPLATE_QUESTIONS: TemplateQuestion[] = [
  { id: 'Q1', text: 'Creació de la taula Hotel amb les restriccions corresponents.' },
  { id: 'Q2', text: 'Creació de la taula Habitació amb les restriccions corresponents.' },
  { id: 'Q3', text: 'Creació de la taula Reserva amb les restriccions corresponents.' },
  { id: 'Q4', text: 'Inserir registres a la taula Hotel.' },
  { id: 'Q5', text: 'Inserir registres a la taula Habitació.' },
  { id: 'Q6', text: 'Inserir registres a la taula Reserva.' },
  { id: 'Q7', text: 'Consultar els hotels de la base de dades.' },
  { id: 'Q8', text: 'Modificar el camp preu de la taula Habitació.' },
  { id: 'Q9', text: 'Eliminar registres de la taula Reserva.' },
  { id: 'Q10', text: 'Llistar els clients amb reserves actives.' },
]

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
