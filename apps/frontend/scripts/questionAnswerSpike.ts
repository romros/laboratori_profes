#!/usr/bin/env npx tsx
/**
 * Harness local: processa un PDF d’examen d’alumne i imprimeix JSON del spike.
 * Ús (des de apps/frontend): npm run spike:qae -- [camí/al.pdf]
 * Per defecte: ../../data/ex_alumne1.pdf (arrel del monorepo, fora de git).
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { runQuestionAnswerExtractionSpike } from '../src/features/question-answer-extraction/services/runQuestionAnswerExtractionSpike'

const defaultPdf = resolve(process.cwd(), '../../data/ex_alumne1.pdf')
const pdfPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : defaultPdf

if (!existsSync(pdfPath)) {
  console.error(`No existeix el PDF: ${pdfPath}`)
  console.error(
    'Passa el camí com a argument o col·loca data/ex_alumne1.pdf a l arrel del repositori (fora de git).',
  )
  process.exit(1)
}

const buf = readFileSync(pdfPath)
console.error(`Llegint ${pdfPath} (${buf.length} bytes)…`)

const result = await runQuestionAnswerExtractionSpike(buf)
console.log(JSON.stringify(result, null, 2))
