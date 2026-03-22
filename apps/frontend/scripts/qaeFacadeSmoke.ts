/**
 * Smoke: mateixa façana que alimenta POST /api/question-answer-extraction (sense multipart).
 * Ús (des de apps/frontend): npx tsx --tsconfig tsconfig.app.json scripts/qaeFacadeSmoke.ts [camí.pdf]
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { executeQuestionAnswerExtractionForPdfBuffer } from '../src/features/question-answer-extraction/server/questionAnswerExtractionHttpRoute'

const defaultPdf = resolve(process.cwd(), '../../data/ex_alumne1.pdf')
const pdfPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : defaultPdf

if (!existsSync(pdfPath)) {
  console.error(`No existeix el PDF: ${pdfPath}`)
  process.exit(1)
}

const buf = readFileSync(pdfPath)
const out = await executeQuestionAnswerExtractionForPdfBuffer(buf)
if (!out.ok) {
  console.error(JSON.stringify(out.body, null, 2))
  process.exit(1)
}
console.log(
  JSON.stringify(
    {
      items: out.body.result.items.length,
      question_ids: out.body.result.items.map((i) => i.question_id),
      status_summary: Object.fromEntries(
        [...new Set(out.body.result.items.map((i) => i.status))].map((s) => [
          s,
          out.body.result.items.filter((i) => i.status === s).length,
        ]),
      ),
      has_diagnostic: out.body.diagnostic != null,
    },
    null,
    2,
  ),
)
