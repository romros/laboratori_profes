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
// Template REAL: F_IT_008_01_Examen_2526_A3 LDD_Ordinaria_Enunciat3 - hospital - DAW.pdf
// Extret del PDF de l'enunciat del professor (lletra d'impremta).
// ---------------------------------------------------------------------------

const TEMPLATE_QUESTIONS: TemplateQuestion[] = [
  { id: 'Q1', text: 'Creació Taula 1 (Hospital) amb les restriccions corresponents.' },
  { id: 'Q2', text: 'Creació Taula 2 (Pacient) amb les restriccions corresponents.' },
  { id: 'Q3', text: 'Creació Taula 3 (Habitacio) amb les restriccions corresponents.' },
  { id: 'Q4', text: 'Creació Taula 4 (Metge) amb les restriccions corresponents.' },
  { id: 'Q5', text: 'Creació Taula 5 (Tractament) amb les restriccions corresponents.' },
  { id: 'Q6', text: 'Creació Taula 6 (Visita) amb les restriccions corresponents.' },
  {
    id: 'Q7',
    text: 'Inserir un hospital amb codi 1 ubicat al carrer Sant Joan, número 50, codi postal 08001, telèfon 932223344.',
  },
  {
    id: 'Q8',
    text: 'Inserir un pacient anomenat Pere Torres Font, amb adreça Passeig de Gràcia, número 12, codi postal 08001, telèfon 934445566 i NIF 12345678A.',
  },
  {
    id: 'Q9',
    text: "Assignar una habitació número 101, de tipus individual, a l'hospital 1 per al pacient amb NIF 12345678A.",
  },
  {
    id: 'Q10',
    text: "Afegir un metge amb NIF 98765432B, nom Dr. Laura López, especialitat Cardiologia, associada a l'hospital 1.",
  },
  {
    id: 'Q11',
    text: 'Assignar un tractament anomenat Rehabilitació Cardíaca, amb idTractament 1, per al pacient 12345678A, assignat al metge 98765432B.',
  },
  {
    id: 'Q12',
    text: 'Registrar una visita amb idVisita 1, data 2024-02-01, import 100€, motiu Revisió postoperatòria, tipus consulta, per al pacient 12345678A, atès pel metge 98765432B.',
  },
  { id: 'Q13', text: "Incrementar en un 15% l'import de totes les visites registrades." },
  {
    id: 'Q14',
    text: 'Canviar el tipus de dades del codi postal de Pacient de numèric a caràcter.',
  },
  { id: 'Q15', text: 'Esborrar totes les visites on el tipus sigui consulta.' },
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
