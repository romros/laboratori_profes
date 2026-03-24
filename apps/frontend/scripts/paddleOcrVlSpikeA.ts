/**
 * Spike A — PaddleOCR-VL-1.5 sobre pàgina sencera
 *
 * Pregunta central:
 *   PaddleOCR-VL-1.5 executat localment dona un OCR prou bo sobre
 *   pàgines senceres d'examen per justificar continuar?
 *
 * Pipeline:
 *   PDF → rasterize (reutilitza codi existent) → PNG per pàgina
 *       → docker run profes-ocr-vl → text + timings per pàgina
 *       → comparativa qualitativa + report markdown
 *
 * Prerequisit Docker:
 *   docker build -t profes-ocr-vl -f apps/ocr-fallback/Dockerfile.vl apps/ocr-fallback
 *
 * Ús (des de apps/frontend):
 *   npm run spike:paddleocr-vl-a
 *
 * Output: docs/spikes/feature4/paddleocr-vl-spike-a.md
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

import { rasterizePdfToPngPages } from '../src/infrastructure/ocr/rasterizePdfToPngPages'

// ── Configuració ──────────────────────────────────────────────────────────────

const DATA_DIR = resolve(process.cwd(), '../../data')
const DOCKER_IMAGE = 'profes-ocr-vl'

// PDFs a processar (dataset de referència: alumne-2 té els pitjors casos)
const PDFS_TO_TEST = [
  'ex_alumne2.pdf',  // pitjors casos OCR — el repte real
  'ex_alumne3.pdf',  // casos intermedis
]

// Límit de pàgines per PDF (null = tot el document)
const PAGE_LIMIT: number | null = null

// ── Tesseract baseline per comparativa (text del dataset congelat) ──────────

const DATASET_PATH = resolve(process.cwd(), '../../docs/spikes/ocr-gate-loop/dataset.json')

type DatasetEntry = {
  id: string
  alumne: string
  question_id: string
  question_desc: string
  ocr_text: string
  manual_text_pass: 'yes' | 'no'
}

const dataset = JSON.parse(readFileSync(DATASET_PATH, 'utf8')) as DatasetEntry[]

// ── Docker runner ─────────────────────────────────────────────────────────────

type VlResult = {
  text: string
  elapsed_ms: number
}

/**
 * Passa un lot de PNGs (pàgines senceres) a PaddleOCR-VL via Docker.
 * Un sol docker run = una sola càrrega del model.
 * Fitxers temporals esborrats sempre (privacy guardrail).
 */
function runPaddleVlBatch(
  items: { id: string; pngBuffer: Buffer }[],
): Map<string, VlResult> {
  if (items.length === 0) return new Map()

  const tmpDir = join(tmpdir(), `spike-vl-a-${Date.now()}`)
  mkdirSync(tmpDir, { recursive: true })

  try {
    for (const item of items) {
      writeFileSync(join(tmpDir, `${item.id}.png`), item.pngBuffer)
    }

    console.error(`  docker run --rm -v ${tmpDir}:/data ${DOCKER_IMAGE} /data`)
    console.error(`  (${items.length} pàgines — pot trigar uns minuts sense GPU)`)

    const proc = spawnSync(
      'docker',
      ['run', '--rm',
        '-v', `${tmpDir}:/data`,
        '-e', 'PADDLE_VL_MAX_TOKENS=1024',
        DOCKER_IMAGE, '/data',
      ],
      { maxBuffer: 100 * 1024 * 1024, encoding: 'utf8', timeout: 30 * 60 * 1000 },
    )

    if (proc.stderr) console.error(proc.stderr)

    if (proc.status !== 0) {
      throw new Error(`docker run fallat (status ${proc.status}): ${proc.stderr?.slice(0, 500)}`)
    }

    const parsed = JSON.parse(proc.stdout) as Record<string, VlResult>
    return new Map(Object.entries(parsed))
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.error('=== Spike A — PaddleOCR-VL-1.5 sobre pàgina sencera ===')
  console.error(`PDFs: ${PDFS_TO_TEST.join(', ')}`)
  console.error('')

  // 1. Rasteritzar PDFs
  console.error('Rasteritzant PDFs…')
  type PageItem = { pdfName: string; pageIndex: number; png: Buffer }
  const allPages: PageItem[] = []

  for (const pdfName of PDFS_TO_TEST) {
    const pdfPath = resolve(DATA_DIR, pdfName)
    if (!existsSync(pdfPath)) {
      console.error(`  SKIP ${pdfName} — no trobat a ${DATA_DIR}`)
      continue
    }
    console.error(`  ${pdfName}`)
    const pages = await rasterizePdfToPngPages(readFileSync(pdfPath))
    const limited = PAGE_LIMIT ? pages.slice(0, PAGE_LIMIT) : pages
    for (const page of limited) {
      allPages.push({ pdfName, pageIndex: page.pageIndex, png: page.png })
    }
    console.error(`    → ${limited.length} pàgines`)
  }

  if (allPages.length === 0) {
    console.error('ERROR: cap pàgina disponible. Comprova que els PDFs existeixen a data/')
    process.exit(1)
  }

  // 2. Executar PaddleOCR-VL (un sol docker run)
  console.error(`\nExecutant PaddleOCR-VL-1.5 sobre ${allPages.length} pàgines…`)
  const t0 = Date.now()

  const batchItems = allPages.map((p) => ({
    id: `${p.pdfName.replace('.pdf', '')}__p${p.pageIndex}`,
    pngBuffer: p.png,
  }))

  const vlResults = runPaddleVlBatch(batchItems)

  const elapsed_ms_total = Date.now() - t0
  const elapsed_ms_per_page = Math.round(elapsed_ms_total / allPages.length)

  console.error(`\nTotal: ${elapsed_ms_total}ms | Per pàgina: ${elapsed_ms_per_page}ms`)
  console.error(`Pàgines processades: ${vlResults.size}/${allPages.length}`)
  const failed = [...vlResults.values()].filter((r) => r.elapsed_ms < 0).length
  if (failed > 0) console.error(`Pàgines fallides: ${failed}`)

  // 3. Generar report
  const lines: string[] = []
  lines.push('# Spike A — PaddleOCR-VL-1.5 sobre pàgina sencera')
  lines.push('')
  lines.push(`**Data execució:** ${new Date().toISOString().slice(0, 10)}`)
  lines.push(`**Model:** PaddleOCR-VL-1.5 (local, CPU, Docker profes-ocr-vl)`)
  lines.push(`**PDFs:** ${PDFS_TO_TEST.join(', ')}`)
  lines.push(`**Pàgines processades:** ${vlResults.size}/${allPages.length}`)
  lines.push(`**elapsed_ms_total:** ${elapsed_ms_total}ms`)
  lines.push(`**elapsed_ms_per_page (mitjana):** ${elapsed_ms_per_page}ms`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Text OCR per pàgina')
  lines.push('')
  lines.push('> Ordenat per PDF i pàgina. Comparativa amb baseline Tesseract on disponible.')
  lines.push('')

  for (const page of allPages) {
    const key = `${page.pdfName.replace('.pdf', '')}__p${page.pageIndex}`
    const result = vlResults.get(key)
    const alumne = page.pdfName.replace('ex_', '').replace('.pdf', '') // ex: alumne-2

    lines.push(`### ${page.pdfName} — pàgina ${page.pageIndex}`)
    lines.push(`> elapsed_ms: ${result?.elapsed_ms ?? 'N/A'}`)
    lines.push('')
    lines.push('**PaddleOCR-VL-1.5:**')
    lines.push('```')
    lines.push((result?.text ?? '(sense resultat)').slice(0, 800).trim())
    lines.push('```')
    lines.push('')

    // Mostrar baseline Tesseract de preguntes d'aquesta pàgina (referència)
    const pageEntries = dataset.filter((d) => d.alumne === alumne)
    if (pageEntries.length > 0 && page.pageIndex <= 2) {
      lines.push('**Tesseract baseline (dataset congelat, mostra de preguntes d\'aquesta alumne):**')
      lines.push('```')
      for (const entry of pageEntries.slice(0, 2)) {
        lines.push(`[${entry.id}] ${entry.ocr_text.slice(0, 150).trim()}`)
      }
      lines.push('```')
      lines.push('')
    }

    lines.push('---')
    lines.push('')
  }

  // Secció de conclusions (a omplir manualment)
  lines.push('## Timings')
  lines.push('')
  lines.push('| pàgina | elapsed_ms | status |')
  lines.push('|--------|-----------|--------|')
  for (const page of allPages) {
    const key = `${page.pdfName.replace('.pdf', '')}__p${page.pageIndex}`
    const result = vlResults.get(key)
    const status = result ? (result.elapsed_ms < 0 ? 'error' : 'ok') : 'no result'
    lines.push(`| ${page.pdfName} p${page.pageIndex} | ${result?.elapsed_ms ?? '—'} | ${status} |`)
  }
  lines.push('')
  lines.push(`| **Total** | **${elapsed_ms_total}** | |`)
  lines.push(`| **Mitjana/pàg** | **${elapsed_ms_per_page}** | |`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Conclusió qualitat (a completar manualment)')
  lines.push('')
  lines.push('> Compara el text de PaddleOCR-VL amb el baseline Tesseract per als pitjors casos.')
  lines.push('> Criteri: "Amb aquest text, podria corregir la resposta?"')
  lines.push('')
  lines.push('| criteri | valoració | notes |')
  lines.push('|---------|----------|-------|')
  lines.push('| Menys caràcters estranys que Tesseract | — | |')
  lines.push('| Keywords SQL recuperables (CREATE TABLE, etc.) | — | |')
  lines.push('| Intenció tècnica reconstruïble | — | |')
  lines.push('| Clarament millor / similar / pitjor que Tesseract | — | |')
  lines.push('')
  lines.push('## Conclusió rendiment (a completar)')
  lines.push('')
  lines.push('| criteri | valoració |')
  lines.push('|---------|----------|')
  lines.push('| Temps per pàgina acceptable (<30s) | — |')
  lines.push('| RAM suficient (cap OOM) | — |')
  lines.push('| Viable per producció CPU | — |')
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Estat del spike')
  lines.push('')
  lines.push('> [ ] **DONE** — qualitat clarament útil i temps acceptable')
  lines.push('> [ ] **IMPLEMENTED, NOT VALIDATED** — codi arrenca, falta evidència sobre examen objectiu')
  lines.push('> [ ] **BLOCKED — PM REVIEW REQUIRED** — qualitat ambigua, RAM insuficient o canvi arquitectònic')

  const report = lines.join('\n')
  const outDir = resolve(process.cwd(), '../../docs/spikes/feature4')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  const outPath = resolve(outDir, 'paddleocr-vl-spike-a.md')
  writeFileSync(outPath, report, 'utf8')

  console.error('')
  console.error(`=== Report guardat: ${outPath} ===`)
  console.log(report)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
