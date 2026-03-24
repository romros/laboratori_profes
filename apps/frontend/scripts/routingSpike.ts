/**
 * Spike 3.C — Router pre-LLM: canal d'avaluació per cada pregunta real.
 *
 * Ús (des de apps/frontend):
 *   npm run spike:routing
 *
 * Llegeix els PDFs reals dels alumnes, executa OCR (QAE) i aplica el router
 * pre-LLM. Mostra quines preguntes van a 'text', 'vision' o 'skip' i per quina raó.
 * No fa cap crida LLM.
 *
 * Necessita:
 *   FEATURE0_OPENAI_API_KEY  → per al QAE (OCR)
 *   PDFs a ../../data/ex_alumne{1,2,3}.pdf
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { runQuestionAnswerExtractionFromPdf } from '../src/features/question-answer-extraction/services/runQuestionAnswerExtractionFromPdf'
import { routeQuestionForEvaluation } from '../src/features/answer-evaluator/services/routeQuestionForEvaluation'
import type { AnswerForEvaluation } from '../src/domain/answer-evaluator/answerEvaluator.schema'

const OPENAI_KEY = process.env.FEATURE0_OPENAI_API_KEY || process.env.OPENAI_API_KEY
if (!OPENAI_KEY) {
  console.error('Cal FEATURE0_OPENAI_API_KEY')
  process.exit(1)
}

const PDF_PATHS = [
  resolve(process.cwd(), '../../data/ex_alumne2.pdf'),
  resolve(process.cwd(), '../../data/ex_alumne3.pdf'),
  resolve(process.cwd(), '../../data/ex_alumne1.pdf'),
].filter((p) => existsSync(p))

if (PDF_PATHS.length === 0) {
  console.error("No s'han trobat PDFs a ../../data/ex_alumne{1,2,3}.pdf")
  process.exit(1)
}

const SEP = '='.repeat(72)
const sep = '-'.repeat(72)

console.log(SEP)
console.log('SPIKE 3.C — Router pre-LLM (text | vision | skip)')
console.log('Sense cap crida LLM — decisió determinista')
console.log(SEP)
console.log()

type RouteSummary = { text: number; vision: number; skip: number; total: number }
const globalSummary: RouteSummary = { text: 0, vision: 0, skip: 0, total: 0 }

for (const pdfPath of PDF_PATHS) {
  const studentId = pdfPath.replace(/.*ex_alumne(\d+)\.pdf$/, 'alumne-$1')
  console.log(`\n┌── ${studentId}`)
  console.log(`│   PDF: ${pdfPath}`)

  const buf = readFileSync(pdfPath)
  const { result: qaeResult } = await runQuestionAnswerExtractionFromPdf(buf)

  console.log(`│   OCR: ${qaeResult.items.length} preguntes detectades`)
  console.log(`│`)

  const summary: RouteSummary = { text: 0, vision: 0, skip: 0, total: 0 }

  for (const item of qaeResult.items) {
    const answer: AnswerForEvaluation = {
      question_id: item.question_id.startsWith('Q') ? item.question_id : `Q${item.question_id}`,
      answer_text: item.answer_text,
      ocr_status: item.status as 'ok' | 'uncertain' | 'empty' | 'not_detected',
    }

    const routing = routeQuestionForEvaluation(answer)

    const routeIcon =
      routing.route === 'text'
        ? '📝 text  '
        : routing.route === 'vision'
          ? '🖼  vision'
          : '⏭  skip  '

    console.log(
      `│   ${routeIcon}  [${item.status.padEnd(12)}]  ${answer.question_id.padEnd(4)}  ${routing.reason.slice(0, 60)}`,
    )

    summary[routing.route]++
    summary.total++
    globalSummary[routing.route]++
    globalSummary.total++
  }

  console.log(`│`)
  console.log(
    `│   Resum: text=${summary.text}  vision=${summary.vision}  skip=${summary.skip}  total=${summary.total}`,
  )
  console.log(`└${sep}`)
}

console.log()
console.log(SEP)
console.log('RESUM GLOBAL')
console.log(SEP)
console.log(
  `  text   : ${globalSummary.text.toString().padStart(3)}  (${Math.round((globalSummary.text / globalSummary.total) * 100)}%)`,
)
console.log(
  `  vision : ${globalSummary.vision.toString().padStart(3)}  (${Math.round((globalSummary.vision / globalSummary.total) * 100)}%)`,
)
console.log(
  `  skip   : ${globalSummary.skip.toString().padStart(3)}  (${Math.round((globalSummary.skip / globalSummary.total) * 100)}%)`,
)
console.log(`  total  : ${globalSummary.total.toString().padStart(3)}`)
console.log(SEP)
console.log()
console.log('Cap crida LLM realitzada. Totes les decisions han estat deterministes.')
