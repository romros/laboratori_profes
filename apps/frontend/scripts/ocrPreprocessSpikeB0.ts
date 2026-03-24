/**
 * Spike B0 — Benchmark de preprocessament mínim sobre els pitjors crops reals
 *
 * Pregunta central:
 *   Amb preprocessament mínim (grayscale + contrast + threshold),
 *   els pitjors crops de Feature 1 passen de "no corregible" a "corregible"?
 *
 * Dataset: 13 crops reals seleccionats de docs/spikes/ocr-gate-loop/dataset.json
 *   (manual_text_pass = 'no', ordenats per ratio alfanumèric ascendent)
 *
 * Variants:
 *   A. baseline  — OCR actual sense preprocessing
 *   B. preA      — grayscale + contrast (0.3) — sense threshold
 *   C. preB      — grayscale + contrast (0.3) + threshold Otsu aproximat (128)
 *
 * No entra: engines nous, LLM, post-correcció semàntica, GPU.
 *
 * Ús (des de apps/frontend):
 *   npm run spike:ocr-preprocess-b0
 *
 * Output: docs/spikes/feature4/spike-b0-preprocess-benchmark.md
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { createWorker, PSM } from 'tesseract.js'

import { preprocessPngForOcr } from '../src/infrastructure/ocr/preprocessPngForOcr'
import { rasterizePdfToPngPages } from '../src/infrastructure/ocr/rasterizePdfToPngPages'
import {
  dedupeQuestionMarkersByFirstId,
  findQuestionMarkers,
} from '../src/features/question-answer-extraction/services/detectQuestionMarkers'
import { segmentByQuestionMarkers } from '../src/features/question-answer-extraction/services/segmentByQuestionMarkers'

// ── Dataset congelat ──────────────────────────────────────────────────────────
// 13 crops: els pitjors de feature 1 (manual_text_pass=no, ordenats per corrupció)
// Dataset congelat — no modificar durant el spike

const DATASET_CROP_IDS = [
  'alumne-1_Q12',
  'alumne-3_Q11',
  'alumne-2_Q7',
  'alumne-1_Q11',
  'alumne-2_Q8',
  'alumne-3_Q9',
  'alumne-3_Q13',
  'alumne-1_Q5',
  'alumne-3_Q8',
  'alumne-1_Q2',
  'alumne-2_Q4',
  'alumne-1_Q9',
  'alumne-2_Q1', // el cas clàssic CRERTE T10y5
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
const dataset = fullDataset.filter((d) => DATASET_CROP_IDS.includes(d.id as typeof DATASET_CROP_IDS[number]))

// ── PDFs ──────────────────────────────────────────────────────────────────────

const DATA_DIR = resolve(process.cwd(), '../../data')

// Mapa alumne → PDF (ex_alumne1 no és al dataset, alumne-1 → ex_alumne2, etc.)
// Nota: "alumne-1" del dataset correspon a ex_alumne1.pdf, etc.
const ALUMNE_TO_PDF: Record<string, string> = {
  'alumne-1': 'ex_alumne1.pdf',
  'alumne-2': 'ex_alumne2.pdf',
  'alumne-3': 'ex_alumne3.pdf',
}

// ── Variants ──────────────────────────────────────────────────────────────────

type Variant = {
  id: 'baseline' | 'preA' | 'preB'
  label: string
  grayscale: boolean
  contrast: number | null
  threshold: number | null
}

const VARIANTS: Variant[] = [
  {
    id: 'baseline',
    label: 'Baseline (sense preprocessing)',
    grayscale: false,
    contrast: null,
    threshold: null,
  },
  {
    id: 'preA',
    label: 'Preprocess A (grayscale + contrast 0.3)',
    grayscale: true,
    contrast: 0.3,
    threshold: null,
  },
  {
    id: 'preB',
    label: 'Preprocess B (grayscale + contrast 0.3 + threshold 128)',
    grayscale: true,
    contrast: 0.3,
    threshold: 128,
  },
]

// ── OCR ───────────────────────────────────────────────────────────────────────

async function ocrPng(pngBuffer: Buffer, variant: Variant): Promise<string> {
  let buf = pngBuffer

  if (variant.grayscale || variant.contrast !== null || variant.threshold !== null) {
    buf = await preprocessPngForOcr(buf, {
      contrast: variant.contrast ?? 0,
      threshold: variant.threshold ?? 256, // 256 = no binaritza (tots blancs descarten)
    })
  }

  const worker = await createWorker('cat')
  await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO })
  try {
    const { data } = await worker.recognize(buf)
    return data.text ?? ''
  } finally {
    await worker.terminate()
  }
}

// ── Extraure text d'una pregunta concreta d'un PDF ────────────────────────────

type PdfCache = {
  pages: { pageIndex: number; png: Buffer }[]
  fullText: Record<string, string> // variantId → fullText
  items: Record<string, { question_id: string; raw_text_block: string }[]> // variantId → items
}

const pdfCache = new Map<string, PdfCache>()

async function getPdfCache(pdfName: string): Promise<PdfCache> {
  if (pdfCache.has(pdfName)) return pdfCache.get(pdfName)!
  const pdfPath = resolve(DATA_DIR, pdfName)
  const pdfBuffer = readFileSync(pdfPath)
  const pages = await rasterizePdfToPngPages(pdfBuffer)
  const cache: PdfCache = { pages, fullText: {}, items: {} }
  pdfCache.set(pdfName, cache)
  return cache
}

async function getQuestionText(
  pdfName: string,
  questionId: string,
  variant: Variant,
): Promise<string> {
  const cache = await getPdfCache(pdfName)

  if (!cache.fullText[variant.id]) {
    // OCR de totes les pàgines del PDF amb aquesta variant
    let fullText = ''
    for (const page of cache.pages) {
      const text = await ocrPng(page.png, variant)
      fullText += `\n<<<PAGE ${page.pageIndex}>>>\n${text}`
    }
    cache.fullText[variant.id] = fullText

    const rawMarkers = findQuestionMarkers(fullText)
    const markers = dedupeQuestionMarkersByFirstId(rawMarkers)
    cache.items[variant.id] = segmentByQuestionMarkers(fullText, markers)
  }

  const items = cache.items[variant.id]!
  const item = items.find((i) => i.question_id === questionId)
  return item?.raw_text_block.replace(/\s+/g, ' ').trim() ?? '(no detectat)'
}

// ── Resultat per crop i variant ───────────────────────────────────────────────

type CropResult = {
  crop_id: string
  alumne: string
  question_id: string
  question_desc: string
  baseline_ocr: string   // de dataset.json (gold del pipeline actual)
  variants: {
    variant_id: string
    ocr_text: string     // text extret
    // corregible: s'omple manualment — el harness ho deixa buit
    corregible: null
  }[]
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.error('=== Spike B0 — Benchmark preprocessament mínim ===')
  console.error(`Dataset: ${dataset.length} crops`)
  console.error(`Variants: ${VARIANTS.map((v) => v.id).join(', ')}`)
  console.error('')

  const results: CropResult[] = []

  for (const entry of dataset) {
    const pdfName = ALUMNE_TO_PDF[entry.alumne]
    if (!pdfName) {
      console.error(`SKIP ${entry.id} — no hi ha PDF per a ${entry.alumne}`)
      continue
    }
    if (!existsSync(resolve(DATA_DIR, pdfName))) {
      console.error(`SKIP ${entry.id} — PDF no trobat: ${pdfName}`)
      continue
    }

    console.error(`\nProcessant ${entry.id} (${pdfName} Q${entry.question_id})…`)

    const variantResults: CropResult['variants'] = []

    for (const variant of VARIANTS) {
      console.error(`  [${variant.id}]…`)
      try {
        const text = await getQuestionText(pdfName, entry.question_id, variant)
        variantResults.push({ variant_id: variant.id, ocr_text: text, corregible: null })
        console.error(`  → ${text.slice(0, 60).replace(/\n/g, ' ')}`)
      } catch (err) {
        console.error(`  ERROR: ${err}`)
        variantResults.push({ variant_id: variant.id, ocr_text: '(error)', corregible: null })
      }
    }

    results.push({
      crop_id: entry.id,
      alumne: entry.alumne,
      question_id: entry.question_id,
      question_desc: entry.question_desc,
      baseline_ocr: entry.ocr_text,
      variants: variantResults,
    })
  }

  // ── Generar report markdown ────────────────────────────────────────────────

  const lines: string[] = []
  lines.push('# Spike B0 — Benchmark preprocessament mínim sobre crops reals')
  lines.push('')
  lines.push(`**Data execució:** ${new Date().toISOString().slice(0, 10)}`)
  lines.push(`**Dataset:** ${dataset.length} crops (manual_text_pass=no, pitjors de Feature 1)`)
  lines.push(`**Variants:** baseline | preA (grayscale+contrast) | preB (grayscale+contrast+threshold)`)
  lines.push(`**Motor OCR:** Tesseract.js WASM, lang=cat, PSM=AUTO`)
  lines.push('')
  lines.push('> **Criteri d\'avaluació manual:** per cada crop i variant, marcar `corregible: yes/no`.')
  lines.push('> Un OCR és corregible si permet identificar paraules clau (SQL, noms, valors)')
  lines.push('> i reconstruir la intenció tècnica de la resposta.')
  lines.push('')
  lines.push('> ⚠️ **IMPORTANT — avaluació independent:**')
  lines.push('> Avalua cada variant **per separat**, sense mirar primer el baseline.')
  lines.push('> Pregunta: "Amb **aquest** text, podria corregir la resposta?"')
  lines.push('> Si mires el baseline primer et contamines i mesures millora relativa, no absoluta.')
  lines.push('> El baseline apareix **al final** de cada secció, no al principi.')
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Resultats per crop')
  lines.push('')

  for (const r of results) {
    lines.push(`### ${r.crop_id} — ${r.question_desc.slice(0, 60)}`)
    lines.push('')

    // Variants primer (evita contaminació: no miris el baseline abans)
    for (const v of r.variants.filter((v) => v.variant_id !== 'baseline')) {
      const varDef = VARIANTS.find((vd) => vd.id === v.variant_id)!
      lines.push(`**${v.variant_id} — ${varDef.label}:**`)
      lines.push('```')
      lines.push(v.ocr_text.slice(0, 300).trim())
      lines.push('```')
      lines.push('')
    }

    // Baseline al final (referència, no punt de partida)
    lines.push('**baseline — Baseline (pipeline actual, per referència — llegir al final):**')
    lines.push('```')
    lines.push(r.baseline_ocr.trim().slice(0, 300))
    lines.push('```')
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  // Taula de validació manual (a omplir)
  lines.push('## Taula de validació manual')
  lines.push('')
  lines.push('> Omplir la columna `corregible` per a cada crop i variant.')
  lines.push('> Criteri: **yes** = puc corregir la resposta amb aquest text | **no** = no puc')
  lines.push('')
  lines.push('| crop_id | impact | baseline | preA | preB | guany preA | guany preB |')
  lines.push('|---------|--------|----------|------|------|-----------|-----------|')
  for (const r of results) {
    lines.push(`| ${r.crop_id} | high/med/low | — | — | — | — | — |`)
  }
  lines.push('')
  lines.push('> `impact`: **high** = borderline (pot ser rescatable) · **medium** = probable irrecuperable · **low** = clarament irrecuperable')
  lines.push('> `guany preX` = `yes` si preX converteix un baseline=no en corregible')
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Conclusió (a completar manualment)')
  lines.push('')
  lines.push('### Resum de guanys')
  lines.push('')
  lines.push('| Variant | Crops rescatats (baseline=no → variant=yes) | d\'ells high-impact |')
  lines.push('|---------|----------------------------------------------|-------------------|')
  lines.push('| preA    | X/13 | X |')
  lines.push('| preB    | X/13 | X |')
  lines.push('')
  lines.push('### Decisió')
  lines.push('')
  lines.push('> [ ] **Opció A — preprocessament útil:** preX rescata ≥ 3/13 crops, i ≥ 1-2 són high-impact')
  lines.push('>     → incorporar com a base de Feature 4, continuar amb Spike B (engines)')
  lines.push('>')
  lines.push('> [ ] **Opció B — preprocessament insuficient:** 0-2 rescatats, o cap high-impact')
  lines.push('>     → no invertir més en preprocessing, passar directament a Spike B (PaddleOCR/Kraken)')
  lines.push('')
  lines.push('*(a completar)*')

  const report = lines.join('\n')

  // Guardar
  const outDir = resolve(process.cwd(), '../../docs/spikes/feature4')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  const outPath = resolve(outDir, 'spike-b0-preprocess-benchmark.md')
  writeFileSync(outPath, report, 'utf8')

  console.error('')
  console.error(`=== Report guardat: ${outPath} ===`)
  console.log(report)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
