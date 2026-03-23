/**
 * Benchmark OCR — Feature 1 QAE (iteració de qualitat)
 *
 * Objectiu: comparar configuracions Tesseract.js (WASM) i Tesseract CLI natiu
 * sobre els 4 PDFs reals per decidir quin motor és més adequat.
 *
 * RESTRICCIÓ DE PRIVACITAT:
 * Els PDFs contenen dades personals d'alumnes. Tot el processament OCR
 * ha de ser LOCAL (servidor o navegador). Cap API cloud (Google, AWS,
 * Azure OCR, etc.) és acceptable. Motors vàlids: Tesseract.js (WASM),
 * Tesseract CLI local, easyocr/paddleocr instal·lats localment.
 *
 * Configuracions comparades:
 *   Tesseract.js (WASM):
 *     1. baseline    — cat, PSM AUTO (3)        [referència anterior]
 *     2. cat_spa     — cat+spa, PSM AUTO (3)
 *     3. psm6        — cat, PSM SINGLE_BLOCK (6)
 *     4. cat_spa_p6  — cat+spa, PSM SINGLE_BLOCK (6)
 *   Tesseract CLI natiu:
 *     5. cli_cat     — cat, PSM AUTO (3)
 *     6. cli_cat_spa — cat+spa, PSM AUTO (3)
 *
 * Ús (des de apps/frontend):
 *   npm run benchmark:ocr
 *
 * Sortida: taula markdown + fragments answer_text + decisió final.
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { createWorker, PSM } from 'tesseract.js'

import { ocrPngBuffersWithTesseractCli } from '../src/infrastructure/ocr/tesseractCliOcrPng'
import { preprocessPngForOcr } from '../src/infrastructure/ocr/preprocessPngForOcr'
import { rasterizePdfToPngPages } from '../src/infrastructure/ocr/rasterizePdfToPngPages'
import {
  dedupeQuestionMarkersByFirstId,
  findQuestionMarkers,
} from '../src/features/question-answer-extraction/services/detectQuestionMarkers'
import { segmentByQuestionMarkers } from '../src/features/question-answer-extraction/services/segmentByQuestionMarkers'

// ---------------------------------------------------------------------------
// Configuracions a comparar
// ---------------------------------------------------------------------------

type OcrEngine = 'tesseract.js' | 'tesseract-cli'

type OcrConfig = {
  id: string
  engine: OcrEngine
  langs: string
  psm: string
  preprocess?: boolean
}

const CONFIGS: OcrConfig[] = [
  // Referència anterior (sense preprocessing)
  { id: 'baseline', engine: 'tesseract.js', langs: 'cat', psm: PSM.AUTO },
  // Preprocessing: grayscale + contrast + threshold (default opts)
  { id: 'pre_cat', engine: 'tesseract.js', langs: 'cat', psm: PSM.AUTO, preprocess: true },
  { id: 'pre_cat_spa', engine: 'tesseract.js', langs: 'cat+spa', psm: PSM.AUTO, preprocess: true },
  { id: 'pre_cli_cat', engine: 'tesseract-cli', langs: 'cat', psm: '3', preprocess: true },
]

// ---------------------------------------------------------------------------
// PDFs
// ---------------------------------------------------------------------------

const DATA_DIR = resolve(process.cwd(), '../../data')
const PDFS = ['ex_alumne1.pdf', 'ex_alumne2.pdf', 'ex_alumne3.pdf', 'ex_alumne4.pdf']

// Resultat esperat de marcadors per PDF (referència baseline documentada)
const EXPECTED_MARKERS: Record<string, number> = {
  'ex_alumne1.pdf': 10,
  'ex_alumne2.pdf': 14,
  'ex_alumne3.pdf': 12,
  'ex_alumne4.pdf': 10,
}

// Casos crítics a mostrar (fragment answer_text)
const CRITICAL_CASES: Record<string, string[]> = {
  'ex_alumne4.pdf': ['2', '3', '4'], // Q2 absorbeix Q3-Q4 en baseline
  'ex_alumne2.pdf': ['7'], // cas bo de referència
}

// ---------------------------------------------------------------------------
// OCR amb configuració
// ---------------------------------------------------------------------------

async function applyPreprocess(pngs: Buffer[], cfg: OcrConfig): Promise<Buffer[]> {
  if (!cfg.preprocess) return pngs
  return Promise.all(pngs.map((png) => preprocessPngForOcr(png)))
}

async function ocrWithConfig(pngs: Buffer[], cfg: OcrConfig): Promise<string[]> {
  const processed = await applyPreprocess(pngs, cfg)
  if (cfg.engine === 'tesseract-cli') {
    return ocrPngBuffersWithTesseractCli(processed, cfg.langs)
  }
  const worker = await createWorker(cfg.langs)
  await worker.setParameters({ tessedit_pageseg_mode: cfg.psm as PSM })
  try {
    const texts: string[] = []
    for (const png of processed) {
      const { data } = await worker.recognize(png)
      texts.push(data.text ?? '')
    }
    return texts
  } finally {
    await worker.terminate()
  }
}

// ---------------------------------------------------------------------------
// Mètriques per PDF + config
// ---------------------------------------------------------------------------

type PdfConfigResult = {
  pdfName: string
  configId: string
  markersDetected: number
  expectedMarkers: number
  hasGiantBlock: boolean // algun bloc > 500 chars de text net
  questionIds: string[]
  criticalFragments: Record<string, string> // question_id -> 120 chars answer_text
}

async function benchmarkPdfWithConfig(
  pdfName: string,
  pdfBuffer: Buffer,
  cfg: OcrConfig,
): Promise<PdfConfigResult> {
  const pages = await rasterizePdfToPngPages(pdfBuffer)
  const pngs = pages.map((p) => p.png)
  const ocrTexts = await ocrWithConfig(pngs, cfg)

  let fullText = ''
  for (let i = 0; i < ocrTexts.length; i++) {
    const pageNum = pages[i]?.pageIndex ?? i + 1
    fullText += `\n<<<PAGE ${pageNum}>>>\n${ocrTexts[i]}`
  }

  const rawMarkers = findQuestionMarkers(fullText)
  const markers = dedupeQuestionMarkersByFirstId(rawMarkers)
  const items = segmentByQuestionMarkers(fullText, markers)

  const hasGiantBlock = items.some((item) => {
    const clean = item.raw_text_block.replace(/\s+/g, ' ').trim()
    return clean.length > 500
  })

  const criticalIds = CRITICAL_CASES[pdfName] ?? []
  const criticalFragments: Record<string, string> = {}
  for (const qid of criticalIds) {
    const item = items.find((i) => i.question_id === qid)
    if (item) {
      const clean = item.raw_text_block.replace(/\s+/g, ' ').trim().slice(0, 120)
      criticalFragments[qid] = clean
    } else {
      criticalFragments[qid] = '(no detectat)'
    }
  }

  return {
    pdfName,
    configId: cfg.id,
    markersDetected: markers.length,
    expectedMarkers: EXPECTED_MARKERS[pdfName] ?? 0,
    hasGiantBlock,
    questionIds: markers.map((m) => m.question_id),
    criticalFragments,
  }
}

// ---------------------------------------------------------------------------
// Taula markdown
// ---------------------------------------------------------------------------

function renderTable(results: PdfConfigResult[]): string {
  const pdfs = [...new Set(results.map((r) => r.pdfName))]
  const configs = [...new Set(results.map((r) => r.configId))]

  const lines: string[] = []
  lines.push('## Taula de resultats')
  lines.push('')

  // Capçalera
  const header = ['PDF', 'Esperat', ...configs].join(' | ')
  const sep = ['---', '---', ...configs.map(() => '---')].join(' | ')
  lines.push(`| ${header} |`)
  lines.push(`| ${sep} |`)

  for (const pdf of pdfs) {
    const expected = EXPECTED_MARKERS[pdf] ?? '?'
    const cells = configs.map((cfgId) => {
      const r = results.find((x) => x.pdfName === pdf && x.configId === cfgId)
      if (!r) return '—'
      const giant = r.hasGiantBlock ? ' ⚠️' : ''
      return `${r.markersDetected}${giant}`
    })
    lines.push(`| ${[pdf, String(expected), ...cells].join(' | ')} |`)
  }

  lines.push('')
  lines.push('`⚠️` = bloc gegant detectat (>500 chars text net)')
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Fragments crítics
// ---------------------------------------------------------------------------

function renderCriticalFragments(results: PdfConfigResult[]): string {
  const criticalPdfs = Object.keys(CRITICAL_CASES)
  const lines: string[] = []
  lines.push('## Fragments crítics (answer_text)')
  lines.push('')

  for (const pdf of criticalPdfs) {
    lines.push(`### ${pdf}`)
    const pdfResults = results.filter((r) => r.pdfName === pdf)
    const qids = CRITICAL_CASES[pdf] ?? []
    for (const qid of qids) {
      lines.push(`**Q${qid}:**`)
      for (const r of pdfResults) {
        const fragment = r.criticalFragments[qid] ?? '—'
        lines.push(`- \`${r.configId}\`: ${fragment}`)
      }
      lines.push('')
    }
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Decisió
// ---------------------------------------------------------------------------

function renderDecision(results: PdfConfigResult[]): string {
  // Criteri: si alguna config millora ≥2 marcadors a ex_alumne4 respecte baseline
  // i redueix el bloc gegant → seguir amb Tesseract tunejat

  const alumne4Baseline = results.find(
    (r) => r.pdfName === 'ex_alumne4.pdf' && r.configId === 'baseline',
  )
  if (!alumne4Baseline) return "## Decisió\n\nNo hi ha dades d'alumne4."

  const baselineMarkers = alumne4Baseline.markersDetected
  const baselineGiant = alumne4Baseline.hasGiantBlock

  const candidates = results.filter(
    (r) =>
      r.pdfName === 'ex_alumne4.pdf' &&
      r.configId !== 'baseline' &&
      r.markersDetected >= baselineMarkers + 2 &&
      (!r.hasGiantBlock || baselineGiant),
  )

  const lines: string[] = []
  lines.push('## Decisió')
  lines.push('')
  lines.push(`**Baseline (alumne4):** ${baselineMarkers} marcadors, bloc gegant: ${baselineGiant}`)
  lines.push('')

  if (candidates.length > 0) {
    const best = candidates.sort((a, b) => b.markersDetected - a.markersDetected)[0]!
    lines.push(
      `✅ **SEGUIR AMB TESSERACT TUNEJAT** — config \`${best.configId}\` millora a **${best.markersDetected} marcadors** (+${best.markersDetected - baselineMarkers} vs baseline), bloc gegant: ${best.hasGiantBlock}.`,
    )
    lines.push('')
    lines.push('**Propera tasca:** implementar tuning OCR amb configuració guanyadora.')
  } else {
    const best4 = results
      .filter((r) => r.pdfName === 'ex_alumne4.pdf' && r.configId !== 'baseline')
      .sort((a, b) => b.markersDetected - a.markersDetected)[0]

    lines.push(
      `⚠️ **EXPLORAR CANVI DE MOTOR** — cap config millora ≥2 marcadors a alumne4 (millor: ${best4?.configId ?? '—'} amb ${best4?.markersDetected ?? '?'} marcadors).`,
    )
    lines.push('')
    lines.push(
      "**Propera tasca:** avaluar motor OCR alternatiu LOCAL (ex: Tesseract CLI natiu, easyocr local, paddleocr local). **Cap API cloud — dades personals d'alumnes.**",
    )
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.error('=== Benchmark OCR — Feature 1 QAE ===')
  console.error(`Configuracions: ${CONFIGS.map((c) => c.id).join(', ')}`)
  console.error(`PDFs: ${PDFS.join(', ')}`)
  console.error('')

  const allResults: PdfConfigResult[] = []

  for (const pdfName of PDFS) {
    const pdfPath = resolve(DATA_DIR, pdfName)
    if (!existsSync(pdfPath)) {
      console.error(`SKIP ${pdfName} — no trobat a ${pdfPath}`)
      continue
    }
    const pdfBuffer = readFileSync(pdfPath)
    console.error(`\nProcessant ${pdfName} (${pdfBuffer.length} bytes)…`)

    for (const cfg of CONFIGS) {
      console.error(`  [${cfg.id}] langs=${cfg.langs} psm=${cfg.psm}…`)
      try {
        const result = await benchmarkPdfWithConfig(pdfName, pdfBuffer, cfg)
        allResults.push(result)
        console.error(
          `  → ${result.markersDetected} marcadors, bloc gegant: ${result.hasGiantBlock}`,
        )
      } catch (err) {
        console.error(`  ERROR: ${err}`)
      }
    }
  }

  const report = [
    '# Benchmark OCR — Feature 1 QAE',
    '',
    `**Data:** ${new Date().toISOString().slice(0, 10)}`,
    `**Configuracions:** ${CONFIGS.map((c) => `\`${c.id}\` (langs=${c.langs}, psm=${c.psm})`).join(', ')}`,
    '',
    renderTable(allResults),
    '',
    renderCriticalFragments(allResults),
    '',
    renderDecision(allResults),
  ].join('\n')

  console.log(report)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
