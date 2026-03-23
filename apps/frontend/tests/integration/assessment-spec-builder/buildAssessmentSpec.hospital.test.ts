/**
 * Golden test — cas hospital DAW (`buildAssessmentSpec`).
 *
 * Execució real del LLM (sense mock). Clau: `ASSESSMENT_SPEC_OPENAI_API_KEY`, `OPENAI_API_KEY`
 * o (dev monorepo) `FEATURE0_OPENAI_API_KEY`. Sense clau → `it.skipIf` (no falla la suite).
 *
 * Observabilitat: `LOG_ASSESSMENT_SPEC_GOLDEN=1` imprimeix JSON; `SAVE_ASSESSMENT_SPEC_GOLDEN=1`
 * escriu `hospitalDawGolden.real-output.json` (només si el test passa). Notes manuals:
 * `hospitalDawGolden.validation-notes.md`.
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import type { QuestionSpec } from '../../../src/domain/assessment-spec/assessmentSpec.schema'
import { buildAssessmentSpec } from '../../../src/features/assessment-spec-builder/services/buildAssessmentSpec'
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

/** Enunciat hospital: totes les preguntes van amb (0,33 punts). */
const EXPECTED_MAX_SCORE = 0.33
const MAX_SCORE_EPS = 0.02

function countSolutionQuestionMarkers(text: string): number {
  return (text.match(/(?:^|\n)\s*Q(?:[1-9]|1[0-5])\./g) ?? []).length
}

/**
 * Si el model encara usa etiquetes sql_*, comprovem coherència amb l'SQL;
 * amb prompt genèric també poden aparèixer altres question_type (p. ex. data_modeling).
 */
function assertSqlKeywordMatchesDeclaredType(q: QuestionSpec): void {
  const t = q.question_type.toLowerCase()
  if (!t.startsWith('sql_')) {
    return
  }
  const a = (q.expected_answer ?? '').toUpperCase()
  if (t === 'sql_ddl') {
    expect(a).toMatch(/CREATE|ALTER|DROP/)
    return
  }
  if (t === 'sql_insert') {
    expect(a).toMatch(/INSERT/)
    return
  }
  if (t === 'sql_update') {
    expect(a).toMatch(/UPDATE/)
    return
  }
  if (t === 'sql_delete') {
    expect(a).toMatch(/DELETE/)
    return
  }
  if (t === 'sql_alter') {
    expect(a).toMatch(/ALTER/)
    return
  }
}

describe('buildAssessmentSpec — golden hospital DAW', () => {
  it.skipIf(!resolveAssessmentSpecApiKey())(
    'estructura, puntuacions, SQL i fragments clau del solucionari',
    async () => {
      const apiKey = resolveAssessmentSpecApiKey()
      const spec = await buildAssessmentSpec({
        examText: hospitalDawExamText,
        solutionText: hospitalDawSolutionText,
        apiKey,
        baseUrl: process.env.ASSESSMENT_SPEC_OPENAI_BASE_URL,
        model: process.env.ASSESSMENT_SPEC_OPENAI_MODEL,
      })

      if (process.env.LOG_ASSESSMENT_SPEC_GOLDEN === '1') {
        console.info('[buildAssessmentSpec hospital golden] sample:', JSON.stringify(spec, null, 2))
      }

      expect(spec.questions.length).toBe(15)

      const ids = new Set<string>()
      for (const q of spec.questions) {
        expect(q.question_id?.trim().length ?? 0).toBeGreaterThan(0)
        expect(q.question_text.trim().length).toBeGreaterThan(0)
        expect(q.question_type?.trim().length ?? 0).toBeGreaterThan(0)
        expect(Array.isArray(q.what_to_evaluate)).toBe(true)
        expect(q.what_to_evaluate.length).toBeGreaterThan(0)
        for (const w of q.what_to_evaluate) {
          expect(typeof w).toBe('string')
          expect(w.trim().length).toBeGreaterThanOrEqual(3)
        }

        expect(ids.has(q.question_id)).toBe(false)
        ids.add(q.question_id)
        assertSqlKeywordMatchesDeclaredType(q)

        const ans = (q.expected_answer ?? '').trim()
        expect(ans.length).toBeGreaterThan(0)
        expect(/CREATE|INSERT|UPDATE|DELETE|ALTER/i.test(ans)).toBe(true)
        expect(countSolutionQuestionMarkers(ans)).toBeLessThanOrEqual(1)
      }

      const withCorrectScore = spec.questions.filter(
        (q) => q.max_score != null && Math.abs(q.max_score - EXPECTED_MAX_SCORE) <= MAX_SCORE_EPS,
      )
      expect(withCorrectScore.length).toBeGreaterThanOrEqual(10)

      const withSqlishAnswer = spec.questions.filter((q) =>
        /CREATE|INSERT|UPDATE|DELETE|ALTER/i.test(q.expected_answer ?? ''),
      )
      expect(withSqlishAnswer.length).toBe(15)

      const answersBlob = spec.questions
        .map((q) => (q.expected_answer ?? '').toLowerCase())
        .join('\n')

      expect(answersBlob).toContain('on delete set null')
      expect(answersBlob).toContain('on delete cascade')
      expect(answersBlob).toMatch(/\bcheck\s*\(/i)

      const questionsWithUsefulCriteria = spec.questions.filter((q) =>
        q.what_to_evaluate.some((w) => w.trim().length >= 15),
      )
      expect(questionsWithUsefulCriteria.length).toBeGreaterThanOrEqual(12)

      if (process.env.SAVE_ASSESSMENT_SPEC_GOLDEN === '1') {
        const outPath = path.join(
          __dirname,
          '../../fixtures/assessment-spec-builder/hospitalDawGolden.real-output.json',
        )
        await writeFile(outPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8')
      }
    },
    180_000,
  )
})
