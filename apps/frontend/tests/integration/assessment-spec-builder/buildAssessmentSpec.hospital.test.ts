/**
 * Golden test — cas hospital DAW (`buildAssessmentSpec`).
 *
 * Execució real del LLM (sense mock). Requereix `ASSESSMENT_SPEC_OPENAI_API_KEY` o
 * `OPENAI_API_KEY`; sense clau → `it.skipIf` (no falla la suite).
 *
 * Observabilitat: text d’entrada a `tests/fixtures/assessment-spec-builder/hospitalDawGolden.ts`;
 * exemple de forma d’output (no usat en assertions) a `hospitalDawGolden.example-output.json`.
 */
import { describe, expect, it } from 'vitest'

import type { QuestionSpec } from '../../../src/domain/assessment-spec/assessmentSpec.schema'
import { buildAssessmentSpec } from '../../../src/features/assessment-spec-builder/services/buildAssessmentSpec'
import {
  hospitalDawExamText,
  hospitalDawSolutionText,
} from '../../fixtures/assessment-spec-builder/hospitalDawGolden'

function resolveAssessmentSpecApiKey(): string {
  return (
    process.env.ASSESSMENT_SPEC_OPENAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || ''
  )
}

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
        expect(ids.has(q.question_id)).toBe(false)
        ids.add(q.question_id)
        assertSqlKeywordMatchesDeclaredType(q)
      }

      const withScore = spec.questions.filter((q) => q.max_score != null)
      expect(withScore.length).toBeGreaterThanOrEqual(10)

      const withSqlishAnswer = spec.questions.filter((q) =>
        /CREATE|INSERT|UPDATE|DELETE|ALTER/i.test(q.expected_answer ?? ''),
      )
      expect(withSqlishAnswer.length).toBeGreaterThanOrEqual(12)

      const answersBlob = spec.questions
        .map((q) => (q.expected_answer ?? '').toLowerCase())
        .join('\n')

      expect(answersBlob).toContain('on delete set null')
      expect(answersBlob).toContain('on delete cascade')
      expect(answersBlob).toMatch(/\bcheck\s*\(/i)
    },
    180_000,
  )
})
