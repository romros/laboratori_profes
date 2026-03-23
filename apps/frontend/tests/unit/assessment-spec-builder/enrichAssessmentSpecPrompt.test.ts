import { describe, expect, it } from 'vitest'

import { buildEnrichAssessmentSpecPrompt } from '../../../src/features/assessment-spec-builder/services/enrichAssessmentSpecPrompt'

describe('buildEnrichAssessmentSpecPrompt', () => {
  it('inclou regles clau (observables, alumne, sense scoring, JSON només)', () => {
    const prompt = buildEnrichAssessmentSpecPrompt('{}')
    expect(prompt).toContain('CRITERIS OBSERVABLES')
    expect(prompt).toContain("CENTRAT EN L'ALUMNE")
    expect(prompt).toContain('NO SCORING')
    expect(prompt).toContain('question_id')
    expect(prompt).toContain('Respon NOMÉS amb un JSON vàlid')
    expect(prompt).toContain('{}')
  })

  it('serialitza l’AssessmentSpec d’entrada al final del prompt', () => {
    const spec = { exam_id: 'x', questions: [] }
    const prompt = buildEnrichAssessmentSpecPrompt(JSON.stringify(spec, null, 2))
    expect(prompt).toContain('"exam_id": "x"')
  })
})
