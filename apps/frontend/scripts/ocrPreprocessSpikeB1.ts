/**
 * Spike B1 — Benchmark engine-agnostic: preprocess × OCR engines
 *
 * Pregunta central:
 *   El guany de preprocessing és transversal (agnòstic de motor) o depèn del motor?
 *
 * Dataset: 13 crops de Spike B0 (dataset congelat)
 * Preprocess: baseline | preA | preB (igual que B0)
 * Engines: tesseract (tesseract.js) | paddleocr (Docker profes-ocr-fallback)
 *
 * Ús (des de apps/frontend):
 *   npm run spike:ocr-preprocess-b1
 *
 * Prerequisit:
 *   docker build -t profes-ocr-fallback ./apps/ocr-fallback
 *
 * Output: docs/spikes/feature4/spike-b1-engine-agnostic-benchmark.md
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

import { createWorker, PSM } from 'tesseract.js'

import { preprocessPngForOcr } from '../src/infrastructure/ocr/preprocessPngForOcr'
import { rasterizePdfToPngPages } from '../src/infrastructure/ocr/rasterizePdfToPngPages'
import {
  dedupeQuestionMarkersByFirstId,
  findQuestionMarkers,
} from '../src/features/question-answer-extraction/services/detectQuestionMarkers'
import { segmentByQuestionMarkers } from '../src/features/question-answer-extraction/services/segmentByQuestionMarkers'

// ── Dataset congelat (igual que B0) ──────────────────────────────────────────

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

// ── PDFs ──────────────────────────────────────────────────────────────────────

const DATA_DIR = resolve(process.cwd(), '../../data')

const ALUMNE_TO_PDF: Record<string, string> = {
  'alumne-1': 'ex_alumne1.pdf',
  'alumne-2': 'ex_alumne2.pdf',
  'alumne-3': 'ex_alumne3.pdf',
}

// ── Variants ──────────────────────────────────────────────────────────────────

type VariantId = 'baseline' | 'preA' | 'preB'

type Variant = {
  id: VariantId
  label: string
  contrast: number | null
  threshold: number | null
}

const VARIANTS: Variant[] = [
  { id: 'baseline', label: 'Baseline (sense preprocessing)',              contrast: null, threshold: null },
  { id: 'preA',     label: 'Preprocess A (grayscale + contrast 0.3)',     contrast: 0.3,  threshold: null },
  { id: 'preB',     label: 'Preprocess B (grayscale + contrast + th.128)', contrast: 0.3,  threshold: 128  },
]

// ── Engines ───────────────────────────────────────────────────────────────────

type EngineId = 'tesseract' | 'paddleocr'

const ENGINES: { id: EngineId; label: string }[] = [
  { id: 'tesseract', label: 'Tesseract.js (WASM, lang=cat, PSM=AUTO)' },
  { id: 'paddleocr', label: 'PaddleOCR (Docker profes-ocr-fallback, lang=es, CPU)' },
]

const DOCKER_IMAGE = 'profes-ocr-fallback'

// ── Tesseract ─────────────────────────────────────────────────────────────────

async function ocrWithTesseract(pngBuffer: Buffer): Promise<string> {
  const worker = await createWorker('cat')
  await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO })
  try {
    const { data } = await worker.recognize(pngBuffer)
    return data.text ?? ''
  } finally {
    await worker.terminate()
  }
}

// ── PaddleOCR via Docker (batch) ──────────────────────────────────────────────

/**
 * Envia un lot de PNGs a PaddleOCR via Docker.
 * Escriu PNGs a un directori temporal, munta el directori al contenidor,
 * llegeix el JSON de sortida i fa cleanup.
 * Un sol docker run = una sola inicialització del model.
 *
 * Privadesa: el directori temporal s'elimina sempre (try/finally).
 */
function runPaddleOcrBatch(
  items: { id: string; pngBuffer: Buffer }[],
): Map<string, string> {
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

    const parsed = JSON.parse(proc.stdout) as Record<string, string>
    return new Map(Object.entries(parsed))
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
}

// ── Preprocessing ─────────────────────────────────────────────────────────────

async function applyPreprocess(pngBuffer: Buffer, variant: Variant): Promise<Buffer> {
  if (variant.contrast === null && variant.threshold === null) return pngBuffer
  return preprocessPngForOcr(pngBuffer, {
    contrast: variant.contrast ?? 0,
    threshold: variant.threshold ?? 256,
  })
}

// ── Segmentació ───────────────────────────────────────────────────────────────

type QuestionItems = { question_id: string; raw_text_block: string }[]

function segmentText(fullText: string): QuestionItems {
  const rawMarkers = findQuestionMarkers(fullText)
  const markers = dedupeQuestionMarkersByFirstId(rawMarkers)
  return segmentByQuestionMarkers(fullText, markers)
}

// ── Cache: (pdfName, variantId, engineId) → QuestionItems ────────────────────

const segmentCache = new Map<string, QuestionItems>()

function cacheKey(pdfName: string, variantId: string, engineId: EngineId): string {
  return `${pdfName}__${variantId}__${engineId}`
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.error('=== Spike B1 — Benchmark engine-agnostic (preprocess × OCR engines) ===')
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
    const pages = await rasterizePdfToPngPages(readFileSync(pdfPath))
    pdfPages.set(pdfName, pages)
  }

  // 2. PaddleOCR: preparar batch (variant × pdf × pàgina) i executar un sol docker run
  console.error('\nPreparant batch PaddleOCR…')
  type BatchItem = { id: string; pdfName: string; variantId: VariantId; pageIndex: number; pngBuffer: Buffer }
  const batchItems: BatchItem[] = []

  for (const variant of VARIANTS) {
    for (const [pdfName, pages] of pdfPages) {
      for (const page of pages) {
        const processed = await applyPreprocess(page.png, variant)
        batchItems.push({
          id: `${variant.id}__${pdfName}__${page.pageIndex}`,
          pdfName,
          variantId: variant.id,
          pageIndex: page.pageIndex,
          pngBuffer: processed,
        })
      }
    }
  }

  console.error(`  ${batchItems.length} pàgines → docker run (1 sola inicialització del model)`)
  const paddleResults = runPaddleOcrBatch(batchItems.map(({ id, pngBuffer }) => ({ id, pngBuffer })))

  // Construir text complet per (pdfName, variantId) i segmentar
  const paddleFullText = new Map<string, string>()
  for (const item of batchItems) {
    const key = `${item.pdfName}__${item.variantId}`
    const pageText = paddleResults.get(item.id) ?? '(no resultat)'
    paddleFullText.set(key, (paddleFullText.get(key) ?? '') + `\n<<<PAGE ${item.pageIndex}>>>\n${pageText}`)
  }
  for (const [key, fullText] of paddleFullText) {
    const [pdfName, variantId] = key.split('__') as [string, string]
    segmentCache.set(cacheKey(pdfName, variantId, 'paddleocr'), segmentText(fullText))
  }

  // 3. Tesseract: processar (variant × pdf × pàgina) seqüencialment
  console.error('\nProcessant amb Tesseract…')
  for (const variant of VARIANTS) {
    for (const [pdfName, pages] of pdfPages) {
      const key = cacheKey(pdfName, variant.id, 'tesseract')
      if (segmentCache.has(key)) continue
      console.error(`  ${pdfName} × ${variant.id}`)
      let fullText = ''
      for (const page of pages) {
        const processed = await applyPreprocess(page.png, variant)
        fullText += `\n<<<PAGE ${page.pageIndex}>>>\n${await ocrWithTesseract(processed)}`
      }
      segmentCache.set(key, segmentText(fullText))
    }
  }

  // 4. Recollir resultats per crop
  type CropResult = {
    crop_id: string
    question_desc: string
    results: { variant_id: VariantId; engine_id: EngineId; ocr_text: string }[]
  }

  const cropResults: CropResult[] = []
  for (const entry of dataset) {
    const pdfName = ALUMNE_TO_PDF[entry.alumne]
    if (!pdfName || !pdfPages.has(pdfName)) { console.error(`SKIP ${entry.id}`); continue }

    const results: CropResult['results'] = []
    for (const variant of VARIANTS) {
      for (const engine of ENGINES) {
        const items = segmentCache.get(cacheKey(pdfName, variant.id, engine.id)) ?? []
        const item = items.find((i) => i.question_id === entry.question_id)
        results.push({
          variant_id: variant.id,
          engine_id: engine.id,
          ocr_text: item?.raw_text_block.replace(/\s+/g, ' ').trim() ?? '(no detectat)',
        })
      }
    }
    cropResults.push({ crop_id: entry.id, question_desc: entry.question_desc, results })
  }

  // 5. Generar report
  const lines: string[] = []
  lines.push('# Spike B1 — Benchmark engine-agnostic: preprocess × OCR engines')
  lines.push('')
  lines.push(`**Data execució:** ${new Date().toISOString().slice(0, 10)}`)
  lines.push('**Dataset:** 13 crops (manual_text_pass=no, Spike B0 congelat)')
  lines.push('**Preprocess:** baseline | preA (grayscale+contrast) | preB (+threshold)')
  lines.push('**Engines:** Tesseract.js (WASM, lang=cat) | PaddleOCR (Docker, lang=en, CPU)')
  lines.push('')
  lines.push('> ⚠️ **IMPORTANT — avaluació independent:**')
  lines.push('> Avalua cada cel·la per separat, sense comparar primer amb baseline.')
  lines.push('> Pregunta per a cada text: "Amb **aquest** text, podria corregir la resposta?"')
  lines.push('> Les variants apareixen **abans** del baseline a cada secció.')
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Textos per crop')
  lines.push('')

  for (const r of cropResults) {
    lines.push(`### ${r.crop_id}`)
    lines.push('')
    lines.push(`**Pregunta:** ${r.question_desc.slice(0, 80)}`)
    lines.push('')

    for (const engine of ENGINES) {
      lines.push(`#### Engine: ${engine.id} — ${engine.label}`)
      lines.push('')
      // Variants en ordre: preA, preB primer; baseline al final (evita contaminació)
      const orderedVariants: VariantId[] = ['preA', 'preB', 'baseline']
      for (const varId of orderedVariants) {
        const res = r.results.find((x) => x.variant_id === varId && x.engine_id === engine.id)
        if (!res) continue
        const varDef = VARIANTS.find((v) => v.id === varId)!
        lines.push(`**${varId}** — ${varDef.label}:`)
        lines.push('```')
        lines.push(res.ocr_text.slice(0, 400).trim())
        lines.push('```')
        lines.push('')
      }
    }
    lines.push('---')
    lines.push('')
  }

  // Taula de validació manual
  lines.push('## Taula de validació manual')
  lines.push('')
  lines.push('> Omplir `corregible` (yes/no) i `impact` (high/med/low) per cada fila.')
  lines.push('> **corregible yes** = puc identificar keywords i reconstruir la intenció.')
  lines.push('> **impact**: high = borderline (pot rescatar-se) · low = clarament irrecuperable.')
  lines.push('')
  lines.push('| crop_id | preprocess | engine | corregible | impact | notes |')
  lines.push('|---------|-----------|--------|-----------|--------|-------|')
  for (const r of cropResults) {
    for (const variant of VARIANTS) {
      for (const engine of ENGINES) {
        lines.push(`| ${r.crop_id} | ${variant.id} | ${engine.id} | — | — | |`)
      }
    }
  }
  lines.push('')
  lines.push('---')
  lines.push('')

  // Resum agregat
  lines.push('## Resum agregat (completar manualment)')
  lines.push('')
  lines.push('### Per preprocess × engine')
  lines.push('')
  lines.push('| preprocess | tesseract | paddleocr | guany vs baseline |')
  lines.push('|-----------|----------|----------|------------------|')
  lines.push('| baseline  | X/13 | X/13 | — |')
  lines.push('| preA      | X/13 | X/13 | +X/-X |')
  lines.push('| preB      | X/13 | X/13 | +X/-X |')
  lines.push('')
  lines.push('### Classificació de resultats')
  lines.push('')
  lines.push('**1. Preprocess transversal** (millora en els dos engines):')
  lines.push('_(crops on preX millora tesseract I paddleocr)_')
  lines.push('')
  lines.push('**2. Preprocess dependent de motor** (millora en un, no en l\'altre):')
  lines.push('_(crops on preX millora un engine però no l\'altre)_')
  lines.push('')
  lines.push('**3. Sense guany** (cap variant millora cap engine):')
  lines.push('_(crops on cap combinació és corregible)_')
  lines.push('')
  lines.push('---')
  lines.push('')

  // Conclusió
  lines.push('## Conclusió (a completar)')
  lines.push('')
  lines.push('> [ ] **A — Preprocess és base vàlida:** guany consistent en els dos engines')
  lines.push('>     → integrar preprocessing al pipeline')
  lines.push('>')
  lines.push('> [ ] **B — Preprocess insuficient:** 0-2 rescatats o cap high-impact')
  lines.push('>     → Spike B2: benchmark motors nous (PaddleOCR vs Kraken vs base)')
  lines.push('>')
  lines.push('> [ ] **C — Resultat mixt:** guany dependent de motor')
  lines.push('>     → estratègia híbrida engine-aware')
  lines.push('')
  lines.push('*(a completar)*')

  const report = lines.join('\n')

  const outDir = resolve(process.cwd(), '../../docs/spikes/feature4')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  const outPath = resolve(outDir, 'spike-b1-engine-agnostic-benchmark.md')
  writeFileSync(outPath, report, 'utf8')

  console.error('')
  console.error(`=== Report guardat: ${outPath} ===`)
  console.log(report)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
