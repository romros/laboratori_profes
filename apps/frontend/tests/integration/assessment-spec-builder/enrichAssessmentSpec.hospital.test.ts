/**
 * Golden test — enriqueiment pedagògic (`enrichAssessmentSpec`) sobre snapshot hospital.
 *
 * Entrada: `hospitalDawGolden.real-output.json` (AssessmentSpec base amb criteris superficials).
 * Sense clau API → `it.skipIf` (mateixes variables que `buildAssessmentSpec`).
 *
 * Observabilitat: `LOG_ENRICH_ASSESSMENT_SPEC=1` imprimeix abans/després (JSON).
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  assessmentSpecSchema,
  type AssessmentSpec,
} from '../../../src/domain/assessment-spec/assessmentSpec.schema'
import { enrichAssessmentSpec } from '../../../src/features/assessment-spec-builder/services/enrichAssessmentSpec'
import {
  hospitalDawExamText,
  hospitalDawSolutionText,
} from '../../fixtures/assessment-spec-builder/hospitalDawGolden'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolveAssessmentSpecApiKey(): string {
  return (
    process.env.ASSESSMENT_SPEC_OPENAI_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.FEATURE0_OPENAI_API_KEY?.trim() ||
    ''
  )
}

function loadHospitalGoldenSpec(): AssessmentSpec {
  const p = path.join(
    __dirname,
    '../../fixtures/assessment-spec-builder/hospitalDawGolden.real-output.json',
  )
  const raw = JSON.parse(readFileSync(p, 'utf8')) as unknown
  return assessmentSpecSchema.parse(raw)
}

/** Patró del golden antic: tres frases genèriques repetides. */
const SHALLOW_WHAT_TO_EVALUATE = [
  'sintaxi SQL',
  'restriccions correctes',
  "coherència amb l'enunciat",
]

function shallowWhatToEvaluateTriple(w: string[]): boolean {
  if (w.length !== SHALLOW_WHAT_TO_EVALUATE.length) return false
  return SHALLOW_WHAT_TO_EVALUATE.every((s, i) => w[i]?.trim() === s)
}

const BANNED_GENERIC_PHRASE = /^(sintaxi sql|restriccions correctes)$/i

describe('enrichAssessmentSpec — golden hospital DAW (segona passada)', () => {
  it.skipIf(!resolveAssessmentSpecApiKey())(
    'preserva identitat de pregunta i enriqueix criteris pedagògics',
    async () => {
      const apiKey = resolveAssessmentSpecApiKey()
      const base = loadHospitalGoldenSpec()

      const enriched = await enrichAssessmentSpec({
        spec: base,
        apiKey,
        baseUrl: process.env.ASSESSMENT_SPEC_OPENAI_BASE_URL,
        model:
          process.env.ASSESSMENT_SPEC_ENRICH_MODEL?.trim() ||
          process.env.ASSESSMENT_SPEC_OPENAI_MODEL,
        examText: hospitalDawExamText,
        solutionText: hospitalDawSolutionText,
      })

      if (process.env.LOG_ENRICH_ASSESSMENT_SPEC === '1') {
        console.info(
          '[enrich hospital] base sample Q1:',
          JSON.stringify(base.questions[0], null, 2),
        )
        console.info(
          '[enrich hospital] enriched Q1:',
          JSON.stringify(enriched.questions[0], null, 2),
        )
      }

      expect(enriched.questions.length).toBe(base.questions.length)
      expect(enriched.exam_id).toBe(base.exam_id)
      expect(enriched.title).toBe(base.title)

      const shallowRemaining = enriched.questions.filter((q) =>
        shallowWhatToEvaluateTriple(q.what_to_evaluate),
      )
      expect(shallowRemaining.length).toBeLessThanOrEqual(2)

      const withBannedPhrase = enriched.questions.filter((q) =>
        q.what_to_evaluate.some((line) => BANNED_GENERIC_PHRASE.test(line.trim())),
      )
      expect(withBannedPhrase.length).toBeLessThanOrEqual(3)

      const withConcreteWhat = enriched.questions.filter((q) =>
        q.what_to_evaluate.some((line) => line.trim().length >= 20),
      )
      expect(withConcreteWhat.length).toBeGreaterThanOrEqual(12)

      const withPedagogyBody = enriched.questions.filter(
        (q) =>
          q.required_elements.length > 0 ||
          q.important_mistakes.length > 0 ||
          q.teacher_style_notes.length > 0,
      )
      expect(withPedagogyBody.length).toBeGreaterThanOrEqual(10)

      for (let i = 0; i < base.questions.length; i++) {
        const b = base.questions[i]
        const e = enriched.questions[i]
        expect(e.question_id).toBe(b.question_id)
        expect(e.question_text).toBe(b.question_text)
        expect(e.expected_answer).toBe(b.expected_answer)
        expect(e.max_score).toBe(b.max_score)
        expect(e.question_type).toBe(b.question_type)
        for (const av of b.accepted_variants) {
          expect(e.accepted_variants).toContain(av)
        }
        expect(e.extraction_confidence).toBe(b.extraction_confidence)
        expect(e.inference_confidence).toBe(b.inference_confidence)
        expect(e.what_to_evaluate.length).toBeGreaterThan(0)
        expect(e.what_to_evaluate.length).toBeLessThanOrEqual(5)
        expect(e.teacher_style_notes.length).toBeLessThanOrEqual(3)
      }

      const pedagogyBlob = enriched.questions
        .flatMap((q) => [...q.what_to_evaluate, ...q.required_elements, ...q.important_mistakes])
        .join('\n')
      expect(pedagogyBlob).not.toMatch(/\b\d+\s*\/\s*\d+\s*punts?\b/i)
      expect(pedagogyBlob).not.toMatch(/\brúbrica\b/i)
    },
    180_000,
  )
})
