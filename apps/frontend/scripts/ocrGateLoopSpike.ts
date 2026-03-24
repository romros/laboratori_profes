/**
 * OCR Gate Loop — Mesura de mètriques per iteració del loop de validació.
 *
 * Ús (des de apps/frontend):
 *   npm run spike:ocr-gate-loop
 *
 * No necessita cap clau API. Aplica el router determinista sobre el dataset congelat
 * i compara amb el gold manual (manual_text_pass).
 *
 * Genera: docs/spikes/ocr-gate-loop/iteration-NN-output.json
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { routeQuestionForEvaluation } from '../src/features/answer-evaluator/services/routeQuestionForEvaluation'
import { detectSemanticOcrQuality } from '../src/features/answer-evaluator/services/detectSemanticOcrQuality'
import type { AnswerForEvaluation } from '../src/domain/answer-evaluator/answerEvaluator.schema'

// ── Dataset congelat ─────────────────────────────────────────────────────────

const DATASET_PATH = resolve(process.cwd(), '../../docs/spikes/ocr-gate-loop/dataset.json')
const ITERATION = process.env.ITERATION ?? '01'
const OUTPUT_PATH = resolve(
  process.cwd(),
  `../../docs/spikes/ocr-gate-loop/iteration-${ITERATION}-output.json`,
)

type DatasetEntry = {
  id: string
  alumne: string
  question_id: string
  question_desc: string
  ocr_status: string
  ocr_text: string
  spike3d_diagnosis: string
  spike3d_concordant: boolean
  manual_text_pass: 'yes' | 'no'
  manual_reason: string
}

const dataset = JSON.parse(readFileSync(DATASET_PATH, 'utf8')) as DatasetEntry[]

// ── Processar cada pregunta ──────────────────────────────────────────────────

type ResultEntry = DatasetEntry & {
  system_route: 'text' | 'vision' | 'skip'
  system_reason: string
  semantic_quality: string
  semantic_gibberish_ratio: number
  semantic_sql_signals: number
  // Decisió combinada: TP / TN / FP / FN respecte a manual_text_pass
  // TP: sistema→text, manual→yes
  // TN: sistema→skip, manual→no
  // FP: sistema→text, manual→no  ← RISC PRINCIPAL
  // FN: sistema→skip, manual→yes ← recall
  classification: 'TP' | 'TN' | 'FP' | 'FN'
}

const results: ResultEntry[] = []

for (const entry of dataset) {
  const answer: AnswerForEvaluation = {
    question_id: entry.question_id,
    answer_text: entry.ocr_text,
    ocr_status: entry.ocr_status as 'ok' | 'uncertain' | 'empty' | 'not_detected',
  }

  const routing = routeQuestionForEvaluation(answer)
  const semantic = detectSemanticOcrQuality(entry.ocr_text)

  const systemText = routing.route === 'text'
  const manualYes = entry.manual_text_pass === 'yes'

  const classification =
    systemText && manualYes
      ? 'TP'
      : !systemText && !manualYes
        ? 'TN'
        : systemText && !manualYes
          ? 'FP'
          : 'FN'

  results.push({
    ...entry,
    system_route: routing.route,
    system_reason: routing.reason,
    semantic_quality: semantic.quality,
    semantic_gibberish_ratio: semantic.gibberishRatio,
    semantic_sql_signals: semantic.sqlFuzzySignalCount,
    classification,
  })
}

// ── Mètriques ────────────────────────────────────────────────────────────────

const tp = results.filter((r) => r.classification === 'TP').length
const tn = results.filter((r) => r.classification === 'TN').length
const fp = results.filter((r) => r.classification === 'FP').length
const fn = results.filter((r) => r.classification === 'FN').length

const bucketText = tp + fp
const precision = bucketText > 0 ? tp / bucketText : 0
const recall = tp + fn > 0 ? tp / (tp + fn) : 0
const fpRate = bucketText > 0 ? fp / bucketText : 0

const SEP = '='.repeat(72)
const sep = '-'.repeat(72)

console.log(SEP)
console.log(`OCR Gate Loop — Iteració ${ITERATION}`)
console.log(SEP)
console.log()
console.log('ROUTING PER PREGUNTA:')
console.log()

for (const r of results) {
  const icon =
    r.classification === 'TP'
      ? '✅ TP'
      : r.classification === 'TN'
        ? '✅ TN'
        : r.classification === 'FP'
          ? '❌ FP'
          : '⚠️  FN'

  console.log(
    `  ${icon}  ${r.id.padEnd(16)}  route=${r.system_route.padEnd(5)}  manual=${r.manual_text_pass}  sem=${r.semantic_quality.padEnd(10)}  gb=${(r.semantic_gibberish_ratio * 100).toFixed(0).padStart(3)}%  sql=${r.semantic_sql_signals}`,
  )
}

console.log()
console.log(SEP)
console.log('MÈTRIQUES PRINCIPALS:')
console.log(SEP)
console.log()
console.log(`  Bucket text:  ${bucketText} preguntes (TP=${tp}, FP=${fp})`)
console.log(`  Bucket skip:  ${tn + fn} preguntes (TN=${tn}, FN=${fn})`)
console.log()
console.log(
  `  PRECISION (text)   : ${(precision * 100).toFixed(1)}%   (objectiu ≥ 70%)  ${precision >= 0.7 ? '✅' : '❌'}`,
)
console.log(
  `  FP rate (text)     : ${(fpRate * 100).toFixed(1)}%   (objectiu ≤ 20%)  ${fpRate <= 0.2 ? '✅' : '❌'}`,
)
console.log(`  RECALL (text)      : ${(recall * 100).toFixed(1)}%   (informatiu)`)
console.log()
console.log(`  TP: ${tp}  TN: ${tn}  FP: ${fp}  FN: ${fn}  Total: ${results.length}`)
console.log()

const llindarOK = precision >= 0.7 && fpRate <= 0.2
console.log(llindarOK ? '>>> LLINDAR ASSOLIT → candidat a FET' : '>>> LLINDAR NO ASSOLIT')
console.log()

// FP detall
if (fp > 0) {
  console.log('FALSE POSITIVES (sistema→text però manual→no):')
  console.log(sep)
  for (const r of results.filter((r) => r.classification === 'FP')) {
    console.log(`  ${r.id}`)
    console.log(`    OCR: ${r.ocr_text.slice(0, 80).replace(/\n/g, ' ')}`)
    console.log(
      `    Sem: ${r.semantic_quality}, gb=${(r.semantic_gibberish_ratio * 100).toFixed(0)}%, sql=${r.semantic_sql_signals}`,
    )
    console.log(`    Router: ${r.system_reason.slice(0, 80)}`)
    console.log(`    Manual: ${r.manual_reason}`)
    console.log()
  }
}

// FN detall
if (fn > 0) {
  console.log('FALSE NEGATIVES (sistema→skip però manual→yes):')
  console.log(sep)
  for (const r of results.filter((r) => r.classification === 'FN')) {
    console.log(`  ${r.id}`)
    console.log(`    OCR: ${r.ocr_text.slice(0, 80).replace(/\n/g, ' ')}`)
    console.log(
      `    Sem: ${r.semantic_quality}, gb=${(r.semantic_gibberish_ratio * 100).toFixed(0)}%, sql=${r.semantic_sql_signals}`,
    )
    console.log(`    Router: ${r.system_reason.slice(0, 80)}`)
    console.log(`    Manual: ${r.manual_reason}`)
    console.log()
  }
}

// ── Guardar output ────────────────────────────────────────────────────────────

const output = {
  iteration: ITERATION,
  date: new Date().toISOString().slice(0, 10),
  metrics: {
    bucket_text: bucketText,
    bucket_skip: tn + fn,
    tp,
    tn,
    fp,
    fn,
    precision: Math.round(precision * 1000) / 1000,
    fp_rate: Math.round(fpRate * 1000) / 1000,
    recall: Math.round(recall * 1000) / 1000,
    llindar_ok: llindarOK,
  },
  results,
}

writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8')
console.log(SEP)
console.log(`Output guardat: ${OUTPUT_PATH}`)
console.log(SEP)
