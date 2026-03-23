import { describe, expect, it } from 'vitest'

import { buildEnrichAssessmentSpecPrompt } from '../../../src/features/assessment-spec-builder/services/enrichAssessmentSpecPrompt'

describe('buildEnrichAssessmentSpecPrompt', () => {
  it('inclou regles clau (observables, alumne, sense scoring, immutabilitat)', () => {
    const prompt = buildEnrichAssessmentSpecPrompt({ specJson: '{}' })
    expect(prompt).toContain('CRITERIS OBSERVABLES')
    expect(prompt).toContain("CENTRAT EN L'ALUMNE")
    expect(prompt).toContain('NO SCORING')
    expect(prompt).toContain('question_id')
    expect(prompt).toContain('Respon NOMÉS amb un JSON vàlid')
    expect(prompt).toContain('REGLA ZERO')
    expect(prompt).toContain('expected_answer')
    expect(prompt).toContain('ASSESSMENT_SPEC_BASE')
  })

  it('inclou blocs ENUNCIAT i SOLUCIONARI quan es passen', () => {
    const prompt = buildEnrichAssessmentSpecPrompt({
      specJson: '{"exam_id":"x"}',
      examText: 'TEXT ENUNCIAT',
      solutionText: 'TEXT SOLU',
    })
    expect(prompt).toContain('## ASSESSMENT_SPEC_BASE')
    expect(prompt).toContain('## ENUNCIAT ORIGINAL')
    expect(prompt).toContain('## SOLUCIONARI ORIGINAL')
    expect(prompt).toContain('TEXT ENUNCIAT')
    expect(prompt).toContain('TEXT SOLU')
    expect(prompt).toContain('"exam_id"')
    expect(prompt).toContain('x')
  })

  it('accepta overload string (només spec JSON)', () => {
    const prompt = buildEnrichAssessmentSpecPrompt('{"q":1}')
    expect(prompt).toContain('## ASSESSMENT_SPEC_BASE')
    expect(prompt).toContain('"q"')
  })
})
