/**
 * Harness: deriva zones de resposta a partir dels anchors detectats.
 *
 * Ús (des de apps/frontend):
 *   npm run spike:answer-zones
 *
 * Llegeix el template real de: tests/fixtures/template-anchor/template_hospital_daw.json
 * Processa: ex_alumne2.pdf, ex_alumne3.pdf, ex_alumne4.pdf
 * Sortida: zones derivades per pregunta, text de la zona, limitacions observades.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { rasterizePdfToPngPages } from '../src/infrastructure/ocr/rasterizePdfToPngPages'
import { ocrPngBuffersWithTesseract } from '../src/infrastructure/ocr/tesseractOcrPng'
import { detectTemplateQuestionAnchors } from '../src/features/template-anchor-detection/detectTemplateQuestionAnchors'
import { deriveAnswerZonesFromAnchors } from '../src/features/template-answer-zones/deriveAnswerZonesFromAnchors'
import type { TemplateQuestion } from '../src/features/template-anchor-detection/types'
import type { OcrPageLines } from '../src/features/template-answer-zones/types'

const TEMPLATE_PATH = resolve(
  process.cwd(),
  'tests/fixtures/template-anchor/template_hospital_daw.json',
)
const DATA_DIR = resolve(process.cwd(), '../../data')
const PDFS = ['ex_alumne2.pdf', 'ex_alumne3.pdf', 'ex_alumne4.pdf']

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

  // detectTemplateQuestionAnchors espera { pageIndex, text } (text pla)
  const ocrPagesFlat = ocrPages.map((p) => ({ pageIndex: p.pageIndex, text: p.lines.join('\n') }))
  const { detected, not_found } = detectTemplateQuestionAnchors(TEMPLATE_QUESTIONS, ocrPagesFlat)
  const result = deriveAnswerZonesFromAnchors(TEMPLATE_QUESTIONS, detected, ocrPages)

  console.log(`\n### ${pdfName}`)
  console.log(
    `Zones derivades: ${result.zones.length} / Anchors: ${detected.length} / No detectades: ${result.not_detected.length}`,
  )
  if (result.not_detected.length > 0) {
    console.log(`No detectades: ${result.not_detected.join(', ')}`)
  }
  if (not_found.length > 0) {
    console.log(`Sense anchor (not_found): ${not_found.join(', ')}`)
  }

  console.log()
  for (const zone of result.zones) {
    const startPage = ocrPages.find((p) => p.pageIndex === zone.start_page_index)
    const endPage = ocrPages.find((p) => p.pageIndex === zone.end_page_index)

    // Extreu les línies de text dins la zona
    const zoneLines: string[] = []
    if (zone.start_page_index === zone.end_page_index) {
      const lines = startPage?.lines ?? []
      zoneLines.push(...lines.slice(zone.start_line_index, zone.end_line_index + 1))
    } else {
      // Línies de la pàgina inicial
      const startLines = startPage?.lines ?? []
      zoneLines.push(...startLines.slice(zone.start_line_index))
      // Pàgines intermèdies
      for (const p of ocrPages) {
        if (p.pageIndex > zone.start_page_index && p.pageIndex < zone.end_page_index) {
          zoneLines.push(...p.lines)
        }
      }
      // Línies de la pàgina final
      const endLines = endPage?.lines ?? []
      zoneLines.push(...endLines.slice(0, zone.end_line_index + 1))
    }

    const zoneText = zoneLines
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .join(' ')
      .slice(0, 120)

    const rangeStr = `p${zone.start_page_index}:L${zone.start_line_index}→p${zone.end_page_index}:L${zone.end_line_index}`
    console.log(`  ${zone.question_id} [sim=${zone.anchor_similarity}] ${rangeStr} | "${zoneText}"`)
  }
}

async function main(): Promise<void> {
  console.error('=== Answer Zones Spike ===')
  console.error(
    `Template: ${templateJson.source ?? TEMPLATE_PATH} (${TEMPLATE_QUESTIONS.length} preguntes)`,
  )

  for (const pdf of PDFS) {
    await processPdf(pdf)
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
