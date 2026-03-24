/**
 * Spike B1 — Benchmark crop-based engine-agnostic (preprocess × OCR engines)
 *
 * Pregunta central:
 *   Sobre crops reals de zona de resposta (Feature 0 layout), hi ha millora
 *   de corregibilitat entre preprocess variants i motors OCR?
 *
 * Pipeline (Feature 4 real):
 *   PDF → rasterize → OCR Tesseract (per layout) → buildTemplateMappedAnswers
 *       → crop zona resposta → preprocess × engines → text
 *
 * NO duplica Feature 1 (no segmentació per text).
 * Reutilitza: rasterizePdfToPngPages, buildTemplateMappedAnswers, preprocessPngForOcr.
 *
 * Prerequisit Docker:
 *   docker build -t profes-ocr-fallback ./apps/ocr-fallback
 *
 * Ús (des de apps/frontend):
 *   npm run spike:ocr-preprocess-b1
 *
 * Output: docs/spikes/feature4/spike-b1-crop-ocr-benchmark.md
 */

import { createCanvas, loadImage } from '@napi-rs/canvas'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createWorker, PSM } from 'tesseract.js'

import { preprocessPngForOcr } from '../src/infrastructure/ocr/preprocessPngForOcr'
import { rasterizePdfToPngPages } from '../src/infrastructure/ocr/rasterizePdfToPngPages'
import { buildTemplateMappedAnswers } from '../src/features/template-answer-zones/services/buildTemplateMappedAnswers'
import type { OcrPageLines } from '../src/features/template-answer-zones/types'
import type { TemplateQuestion } from '../src/features/template-anchor-detection/types'

// ── Dataset congelat ──────────────────────────────────────────────────────────
// 13 crops: manual_text_pass=no (pitjors de Feature 1 — dataset Spike B0)

const DATASET_CROP_IDS = [
  'alumne-1_Q12', 'alumne-3_Q11', 'alumne-2_Q7',
  'alumne-1_Q11', 'alumne-2_Q8',  'alumne-3_Q9',
  'alumne-3_Q13', 'alumne-1_Q5',  'alumne-3_Q8',
  'alumne-1_Q2',  'alumne-2_Q4',  'alumne-1_Q9',
  'alumne-2_Q1',
] as const

type DatasetEntry = {
  id: string
  alumne: string
  question_id: string
  question_desc: string
  ocr_status: string
  ocr_text: string
  manual_text_pass: 'yes' | 'no'
  manual_reason: string
}

const DATASET_PATH = resolve(process.cwd(), '../../docs/spikes/ocr-gate-loop/dataset.json')
const fullDataset = JSON.parse(readFileSync(DATASET_PATH, 'utf8')) as DatasetEntry[]
const dataset = fullDataset.filter(
  (d) => DATASET_CROP_IDS.includes(d.id as (typeof DATASET_CROP_IDS)[number]),
)

// ── PDFs i template ───────────────────────────────────────────────────────────

const DATA_DIR = resolve(process.cwd(), '../../data')

const ALUMNE_TO_PDF: Record<string, string> = {
  'alumne-1': 'ex_alumne1.pdf',
  'alumne-2': 'ex_alumne2.pdf',
  'alumne-3': 'ex_alumne3.pdf',
}

const TEMPLATE_PATH = resolve(
  process.cwd(),
  'tests/fixtures/template-anchor/template_hospital_daw.json',
)
const templateJson = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf8')) as {
  questions: TemplateQuestion[]
}
const TEMPLATE_QUESTIONS = templateJson.questions

// ── Variants ──────────────────────────────────────────────────────────────────

type VariantId = 'baseline' | 'preA' | 'preB'

type Variant = {
  id: VariantId
  label: string
  contrast: number | null
  threshold: number | null
}

const VARIANTS: Variant[] = [
  { id: 'baseline', label: 'Baseline (sense preprocessing)',               contrast: null, threshold: null },
  { id: 'preA',     label: 'Preprocess A (grayscale + contrast 0.3)',      contrast: 0.3,  threshold: null },
  { id: 'preB',     label: 'Preprocess B (grayscale + contrast + th.128)', contrast: 0.3,  threshold: 128  },
]

// ── Engines ───────────────────────────────────────────────────────────────────

type EngineId = 'tesseract' | 'paddleocr'

const ENGINES: { id: EngineId; label: string }[] = [
  { id: 'tesseract', label: 'Tesseract.js (WASM, lang=cat, PSM=AUTO)' },
  { id: 'paddleocr', label: 'PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)' },
]

const DOCKER_IMAGE = 'profes-ocr-fallback'

// ── Tesseract per crop (retorna text i bboxes de línia) ───────────────────────

type TessLine = {
  text: string
  y0: number
  y1: number
}

type PageOcrData = {
  pageIndex: number
  textLines: string[]    // per buildTemplateMappedAnswers
  tessLines: TessLine[]  // per mapar line_index → pixel Y
  width: number
  height: number
}

async function ocrPageFull(pngBuffer: Buffer, pageIndex: number): Promise<PageOcrData> {
  const worker = await createWorker('cat')
  await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO })
  try {
    const { data } = await worker.recognize(pngBuffer)
    const tessLines: TessLine[] = []
    for (const block of data.blocks ?? []) {
      for (const para of block.paragraphs ?? []) {
        for (const line of para.lines ?? []) {
          tessLines.push({ text: line.text, y0: line.bbox.y0, y1: line.bbox.y1 })
        }
      }
    }
    // Obtenir dimensions reals de la imatge
    const img = await loadImage(pngBuffer)
    return {
      pageIndex,
      textLines: (data.text ?? '').split('\n'),
      tessLines,
      width: img.width,
      height: img.height,
    }
  } finally {
    await worker.terminate()
  }
}

async function ocrCropWithTesseract(pngBuffer: Buffer): Promise<string> {
  const worker = await createWorker('cat')
  await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO })
  try {
    const { data } = await worker.recognize(pngBuffer)
    return data.text ?? ''
  } finally {
    await worker.terminate()
  }
}

// ── Crop de zona de resposta ──────────────────────────────────────────────────

/**
 * Mapeja un índex de línia OCR (en textLines) a la Y pixel corresponent.
 *
 * textLines pot tenir línies buides que tessLines no té.
 * Estratègia: comptar línies no buides abans de lineIdx → índex a tessLines.
 */
function lineIdxToPixelY(
  textLines: string[],
  tessLines: TessLine[],
  lineIdx: number,
  side: 'top' | 'bottom',
): number | null {
  let nonEmptyCount = 0
  for (let i = 0; i <= Math.min(lineIdx, textLines.length - 1); i++) {
    if (textLines[i]?.trim()) nonEmptyCount++
  }
  const tessIdx = Math.max(0, nonEmptyCount - 1)
  const line = tessLines[Math.min(tessIdx, tessLines.length - 1)]
  if (!line) return null
  return side === 'top' ? line.y0 : line.y1
}

/**
 * Retalla un PNG a la zona de resposta donada pels índexos de línia.
 * Padding vertical (+5% alçada) per no tallar contingut.
 * Privacy: no persisteix cap fitxer — retorna Buffer en memòria.
 */
async function cropAnswerZone(
  pagePng: Buffer,
  pageData: PageOcrData,
  startLineIdx: number,
  endLineIdx: number,
): Promise<Buffer | null> {
  const y0raw = lineIdxToPixelY(pageData.textLines, pageData.tessLines, startLineIdx, 'top')
  const y1raw = lineIdxToPixelY(pageData.textLines, pageData.tessLines, endLineIdx, 'bottom')

  if (y0raw === null || y1raw === null) return null

  const padding = Math.round(pageData.height * 0.02)
  const y0 = Math.max(0, y0raw - padding)
  const y1 = Math.min(pageData.height, y1raw + padding)
  const cropH = y1 - y0
  if (cropH < 10) return null

  const img = await loadImage(pagePng)
  const canvas = createCanvas(pageData.width, cropH)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, y0, pageData.width, cropH, 0, 0, pageData.width, cropH)
  return canvas.toBuffer('image/png')
}

// ── Preprocessing ─────────────────────────────────────────────────────────────

async function applyPreprocess(pngBuffer: Buffer, variant: Variant): Promise<Buffer> {
  if (variant.contrast === null && variant.threshold === null) return pngBuffer
  return preprocessPngForOcr(pngBuffer, {
    contrast: variant.contrast ?? 0,
    threshold: variant.threshold ?? 256,
  })
}

// ── PaddleOCR batch via Docker ────────────────────────────────────────────────

/**
 * Envia tots els crops preprocesats a PaddleOCR via un sol docker run.
 * Fitxers temporals garantidament esborrats (privacy guardrail).
 */
function runPaddleOcrBatch(items: { id: string; pngBuffer: Buffer }[]): Map<string, string> {
  if (items.length === 0) return new Map()

  const tmpDir = join(tmpdir(), `spike-b1-paddle-${Date.now()}`)
  mkdirSync(tmpDir, { recursive: true })

  try {
    for (const item of items) {
      writeFileSync(join(tmpDir, `${item.id}.png`), item.pngBuffer)
    }

    console.error(`  docker run --rm -v ${tmpDir}:/data ${DOCKER_IMAGE} /data`)
    const proc = spawnSync(
      'docker',
      ['run', '--rm', '-v', `${tmpDir}:/data`, DOCKER_IMAGE, '/data'],
      { maxBuffer: 50 * 1024 * 1024, encoding: 'utf8' },
    )

    if (proc.stderr) console.error(proc.stderr)
    if (proc.status !== 0) {
      throw new Error(`docker run fallat (status ${proc.status}): ${proc.stderr?.slice(0, 300)}`)
    }

    return new Map(Object.entries(JSON.parse(proc.stdout) as Record<string, string>))
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.error('=== Spike B1 — Benchmark crop-based engine-agnostic ===')
  console.error(`Dataset: ${dataset.length} crops | Variants: ${VARIANTS.length} | Engines: ${ENGINES.length}`)
  console.error('')

  // 1. Rasteritzar PDFs (una vegada per PDF)
  const neededPdfs = [...new Set(
    dataset.map((d) => ALUMNE_TO_PDF[d.alumne]).filter(Boolean) as string[],
  )]

  console.error('Rasteritzant PDFs…')
  const pdfPages = new Map<string, { pageIndex: number; png: Buffer }[]>()
  for (const pdfName of neededPdfs) {
    const pdfPath = resolve(DATA_DIR, pdfName)
    if (!existsSync(pdfPath)) { console.error(`  SKIP ${pdfName} — no trobat`); continue }
    console.error(`  ${pdfName}`)
    pdfPages.set(pdfName, await rasterizePdfToPngPages(readFileSync(pdfPath)))
  }

  // 2. OCR complet (Tesseract) per layout: text + bboxes per línia
  console.error('\nOCR per layout (Tesseract, una vegada per PDF)…')
  const pdfOcrData = new Map<string, PageOcrData[]>()

  for (const [pdfName, pages] of pdfPages) {
    console.error(`  ${pdfName}`)
    const ocrPages: PageOcrData[] = []
    for (const page of pages) {
      const ocrData = await ocrPageFull(page.png, page.pageIndex)
      ocrPages.push(ocrData)
    }
    pdfOcrData.set(pdfName, ocrPages)
  }

  // 3. buildTemplateMappedAnswers (layout) per cada PDF
  console.error('\nLayout mapping (Feature 0)…')
  type QuestionRange = {
    start_page_index: number
    start_line_index: number
    end_page_index: number
    end_line_index: number
  }
  const pdfQuestionRanges = new Map<string, Map<string, QuestionRange>>()

  for (const [pdfName, ocrPages] of pdfOcrData) {
    const ocrPageLines: OcrPageLines[] = ocrPages.map((p) => ({
      pageIndex: p.pageIndex,
      lines: p.textLines,
    }))
    const result = buildTemplateMappedAnswers(TEMPLATE_QUESTIONS, ocrPageLines)
    const rangeMap = new Map<string, QuestionRange>()
    for (const q of result.questions) {
      if (q.range.start_page_index !== null && q.range.start_line_index !== null) {
        rangeMap.set(q.question_id, {
          start_page_index: q.range.start_page_index,
          start_line_index: q.range.start_line_index,
          end_page_index: q.range.end_page_index ?? q.range.start_page_index,
          end_line_index: q.range.end_line_index ?? q.range.start_line_index,
        })
      }
    }
    pdfQuestionRanges.set(pdfName, rangeMap)
    const detected = result.questions.filter((q) => q.is_detected).length
    console.error(`  ${pdfName}: ${detected}/${result.questions.length} preguntes detectades`)
  }

  // 4. Generar crops per dataset entry
  console.error('\nGenerant crops de zones de resposta…')

  type CropData = {
    crop_id: string
    question_desc: string
    cropPng: Buffer | null  // null = no s'ha pogut retallar
    cropNote: string
  }

  const cropDataList: CropData[] = []

  for (const entry of dataset) {
    const pdfName = ALUMNE_TO_PDF[entry.alumne]
    if (!pdfName || !pdfPages.has(pdfName)) {
      cropDataList.push({ crop_id: entry.id, question_desc: entry.question_desc, cropPng: null, cropNote: 'PDF no disponible' })
      continue
    }

    const rangeMap = pdfQuestionRanges.get(pdfName)
    const questionId = entry.question_id  // 'Q1', 'Q12', etc.
    const range = rangeMap?.get(questionId)

    if (!range) {
      cropDataList.push({ crop_id: entry.id, question_desc: entry.question_desc, cropPng: null, cropNote: 'zona no detectada per layout' })
      console.error(`  SKIP ${entry.id} — zona no detectada`)
      continue
    }

    // Agafar la pàgina d'inici de la zona
    const pageData = pdfOcrData.get(pdfName)?.[range.start_page_index]
    const pagePng = pdfPages.get(pdfName)?.[range.start_page_index]?.png

    if (!pageData || !pagePng) {
      cropDataList.push({ crop_id: entry.id, question_desc: entry.question_desc, cropPng: null, cropNote: 'pàgina no disponible' })
      continue
    }

    const cropPng = await cropAnswerZone(pagePng, pageData, range.start_line_index, range.end_line_index)
    cropDataList.push({
      crop_id: entry.id,
      question_desc: entry.question_desc,
      cropPng,
      cropNote: cropPng ? `pàg.${range.start_page_index} línies ${range.start_line_index}–${range.end_line_index}` : 'crop buit',
    })
    console.error(`  ${entry.id}: ${cropPng ? 'OK' : 'FALLIDA'} (pàg.${range.start_page_index} l.${range.start_line_index}–${range.end_line_index})`)
  }

  // 5. Preparar matriu crops × variants × PaddleOCR (batch)
  console.error('\nPreparant batch PaddleOCR (crops × variants)…')

  type CropVariantKey = `${string}__${VariantId}`
  const processedCrops = new Map<CropVariantKey, Buffer>()

  for (const crop of cropDataList) {
    if (!crop.cropPng) continue
    for (const variant of VARIANTS) {
      const processed = await applyPreprocess(crop.cropPng, variant)
      processedCrops.set(`${crop.crop_id}__${variant.id}`, processed)
    }
  }

  const paddleBatchItems = [...processedCrops.entries()].map(([key, pngBuffer]) => ({
    id: key,
    pngBuffer,
  }))

  console.error(`  ${paddleBatchItems.length} crops a processar amb PaddleOCR`)
  const paddleResults = runPaddleOcrBatch(paddleBatchItems)

  // 6. OCR Tesseract sobre cada crop × variant
  console.error('\nOCR Tesseract sobre crops…')
  const tesseractResults = new Map<CropVariantKey, string>()

  for (const [key, pngBuffer] of processedCrops) {
    const text = await ocrCropWithTesseract(pngBuffer)
    tesseractResults.set(key as CropVariantKey, text.replace(/\s+/g, ' ').trim())
  }

  // 7. Recollir resultats
  type ResultEntry = {
    crop_id: string
    question_desc: string
    cropNote: string
    results: { variant_id: VariantId; engine_id: EngineId; ocr_text: string }[]
  }

  const allResults: ResultEntry[] = cropDataList.map((crop) => {
    const results: ResultEntry['results'] = []
    for (const variant of VARIANTS) {
      const key: CropVariantKey = `${crop.crop_id}__${variant.id}`
      results.push({
        variant_id: variant.id,
        engine_id: 'tesseract',
        ocr_text: tesseractResults.get(key) ?? '(no crop)',
      })
      results.push({
        variant_id: variant.id,
        engine_id: 'paddleocr',
        ocr_text: paddleResults.get(key)?.replace(/\s+/g, ' ').trim() ?? '(no crop)',
      })
    }
    return { crop_id: crop.crop_id, question_desc: crop.question_desc, cropNote: crop.cropNote, results }
  })

  // 8. Generar report markdown
  const lines: string[] = []
  lines.push('# Spike B1 — Benchmark crop-based engine-agnostic')
  lines.push('')
  lines.push(`**Data execució:** ${new Date().toISOString().slice(0, 10)}`)
  lines.push('**Dataset:** 13 crops (manual_text_pass=no, dataset Spike B0 congelat)')
  lines.push('**Pipeline crop:** rasterize → Tesseract OCR → buildTemplateMappedAnswers → crop zona resposta')
  lines.push('**Preprocess:** baseline | preA (grayscale+contrast) | preB (+threshold)')
  lines.push('**Engines:** Tesseract.js (WASM, lang=cat) | PaddleOCR (Docker, lang=es, CPU)')
  lines.push('')
  lines.push('> ⚠️ **Avaluació independent:** avalua cada cel·la per separat.')
  lines.push('> Pregunta: "Amb **aquest** text, podria corregir la resposta?"')
  lines.push('> Les variants apareixen **abans** del baseline a cada secció.')
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Textos per crop')
  lines.push('')

  for (const r of allResults) {
    lines.push(`### ${r.crop_id} — ${r.question_desc.slice(0, 70)}`)
    lines.push(`> Crop: ${r.cropNote}`)
    lines.push('')

    for (const engine of ENGINES) {
      lines.push(`#### ${engine.id} — ${engine.label}`)
      lines.push('')
      const orderedVariants: VariantId[] = ['preA', 'preB', 'baseline']
      for (const varId of orderedVariants) {
        const res = r.results.find((x) => x.variant_id === varId && x.engine_id === engine.id)
        const varDef = VARIANTS.find((v) => v.id === varId)!
        lines.push(`**${varId}** — ${varDef.label}:`)
        lines.push('```')
        lines.push((res?.ocr_text ?? '(sense resultat)').slice(0, 500).trim())
        lines.push('```')
        lines.push('')
      }
    }
    lines.push('---')
    lines.push('')
  }

  // Taula de validació manual
  const validCrops = allResults.filter((r) => r.cropNote.startsWith('pàg.'))
  lines.push('## Taula de validació manual')
  lines.push('')
  lines.push('> Omplir `corregible` (yes/no) i `impact` (high/med/low) per cada fila.')
  lines.push('> **yes** = puc recuperar keywords i reconstruir la intenció tècnica.')
  lines.push('')
  lines.push('| crop_id | preprocess | engine | corregible | impact | notes |')
  lines.push('|---------|-----------|--------|-----------|--------|-------|')
  for (const r of validCrops) {
    for (const variant of VARIANTS) {
      for (const engine of ENGINES) {
        lines.push(`| ${r.crop_id} | ${variant.id} | ${engine.id} | — | — | |`)
      }
    }
  }
  lines.push('')
  lines.push('---')
  lines.push('')

  // Resum
  lines.push('## Resum agregat (completar manualment)')
  lines.push('')
  lines.push('| preprocess | tesseract | paddleocr | guany vs baseline |')
  lines.push('|-----------|----------|----------|------------------|')
  lines.push('| baseline  | X/13 | X/13 | — |')
  lines.push('| preA      | X/13 | X/13 | +X/-X |')
  lines.push('| preB      | X/13 | X/13 | +X/-X |')
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Conclusió (a completar)')
  lines.push('')
  lines.push('> [ ] **A — Preprocess transversal:** millora en els dos engines → integrar al pipeline')
  lines.push('>')
  lines.push('> [ ] **B — Motor nou guanya:** PaddleOCR millor sense preprocess → adoptar com a fallback')
  lines.push('>')
  lines.push('> [ ] **C — Sense millora:** via morta → explorar models més avançats')
  lines.push('')
  lines.push('*(a completar)*')

  const report = lines.join('\n')
  const outDir = resolve(process.cwd(), '../../docs/spikes/feature4')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  const outPath = resolve(outDir, 'spike-b1-crop-ocr-benchmark.md')
  writeFileSync(outPath, report, 'utf8')

  console.error('')
  console.error(`=== Report guardat: ${outPath} ===`)
  console.log(report)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
