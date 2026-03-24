/**
 * Harness real Feature 3 — gradeExam amb LLM real.
 *
 * Ús (des de apps/frontend):
 *   ASSESSMENT_SPEC_OPENAI_API_KEY=sk-... npm run spike:grade-exam
 *
 * Llegeix: tests/fixtures/assessment-spec-builder/hospitalDawGolden.enriched-output.json
 * Usa: 5 respostes simulades d'alumne (correcta, parcial, incorrecta, empty, uncertain)
 * Mostra: evaluable_by_ocr, verdict, feedback, confidence per cada pregunta
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { gradeExam } from '../src/features/answer-evaluator/services/gradeExam'
import type { AssessmentSpec } from '../src/domain/assessment-spec/assessmentSpec.schema'
import { hospitalDawExamDocumentContext } from '../tests/fixtures/assessment-spec-builder/hospitalDawGolden'

const API_KEY =
  process.env.ASSESSMENT_SPEC_OPENAI_API_KEY ||
  process.env.OPENAI_API_KEY ||
  process.env.FEATURE0_OPENAI_API_KEY

if (!API_KEY) {
  console.error('Cal ASSESSMENT_SPEC_OPENAI_API_KEY (o OPENAI_API_KEY). Atura.')
  process.exit(1)
}

const ENRICHED_FIXTURE = resolve(
  process.cwd(),
  'tests/fixtures/assessment-spec-builder/hospitalDawGolden.enriched-output.json',
)

const spec = JSON.parse(readFileSync(ENRICHED_FIXTURE, 'utf8')) as AssessmentSpec

// 5 respostes simulades per a Q1..Q5 (diferents escenaris)
const answers = [
  {
    question_id: 'Q1',
    ocr_status: 'ok' as const,
    // Resposta correcta — té PRIMARY KEY, NOT NULL i CHECK
    answer_text: `CREATE TABLE Hospital (
  codi INT PRIMARY KEY,
  cp CHAR(5) NOT NULL,
  carrer VARCHAR(120) NOT NULL,
  numero INT NOT NULL CHECK (numero > 0),
  telefon VARCHAR(20) NOT NULL
);`,
  },
  {
    question_id: 'Q2',
    ocr_status: 'ok' as const,
    // Resposta parcial — té la taula però falta ON DELETE SET NULL
    answer_text: `CREATE TABLE Pacient (
  nif CHAR(9) PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  cognoms VARCHAR(150) NOT NULL,
  cp CHAR(5) NOT NULL,
  carrer VARCHAR(120) NOT NULL,
  numero INT NOT NULL,
  telefon VARCHAR(20) NOT NULL
);`,
  },
  {
    question_id: 'Q3',
    ocr_status: 'ok' as const,
    // Resposta incorrecta — confon ON DELETE (CASCADE en lloc de SET NULL)
    answer_text: `CREATE TABLE Habitacio (
  numHabitacio INT PRIMARY KEY,
  tipus VARCHAR(20) CHECK (tipus IN ('individual', 'compartida')),
  codiHosp INT REFERENCES Hospital(codi) ON DELETE CASCADE,
  nifPacient CHAR(9) REFERENCES Pacient(nif) ON DELETE CASCADE
);`,
  },
  {
    question_id: 'Q4',
    ocr_status: 'empty' as const,
    // Sense resposta
    answer_text: '',
  },
  {
    question_id: 'Q5',
    ocr_status: 'uncertain' as const,
    // OCR dubtós — text parcialment llegible
    answer_text: `CREAT TABL Tractament (
  idTractament INT PRIMAR KEY,
  nomTractament VRCHAR(100),
  nifPacient CHAR(9) REFERENC Pacient(nif),
  nifMetge CHAR(9)
)`,
  },
]

console.log('='.repeat(60))
console.log('FEATURE 3 — gradeExam spike')
console.log(`Spec: ${spec.exam_id} (${spec.questions.length} preguntes)`)
console.log(`Alumne: alumne-spike-001`)
console.log(`Preguntes a avaluar: ${answers.length}`)
console.log('='.repeat(60))
console.log()

const result = await gradeExam({
  student_id: 'alumne-spike-001',
  assessment_spec: spec,
  answers,
  exam_document_context: hospitalDawExamDocumentContext,
  apiKey: API_KEY,
})

for (const qr of result.question_results) {
  console.log(`--- ${qr.question_id} ---`)
  console.log(`  evaluable_by_ocr : ${qr.evaluable_by_ocr}`)
  console.log(`  evaluability_reason: ${qr.evaluability_reason}`)
  if (qr.verdict !== null) {
    console.log(`  verdict          : ${qr.verdict}`)
    console.log(`  confidence       : ${qr.confidence?.toFixed(2)}`)
    console.log(`  feedback         : ${qr.feedback}`)
  } else {
    console.log(`  (LLM no invocat — no avaluable)`)
  }
  console.log()
}

console.log('='.repeat(60))
console.log('RESUM')
const evaluable = result.question_results.filter((q) => q.evaluable_by_ocr !== 'no')
const graded = result.question_results.filter((q) => q.verdict !== null)
console.log(`  Avaluables: ${evaluable.length}/${result.question_results.length}`)
console.log(`  Graduades (LLM invocat): ${graded.length}`)
const correct = graded.filter((q) => q.verdict === 'correct').length
const partial = graded.filter((q) => q.verdict === 'partial').length
const incorrect = graded.filter((q) => q.verdict === 'incorrect').length
console.log(`  correct: ${correct}  partial: ${partial}  incorrect: ${incorrect}`)
console.log('='.repeat(60))
