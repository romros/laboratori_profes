import { describe, expect, it } from 'vitest'

import { buildAssessmentSpecPrompt } from '../../../src/features/assessment-spec-builder/services/buildAssessmentSpecPrompt'

describe('buildAssessmentSpecPrompt', () => {
  const examText = 'Pregunta 1: Defineix una taula SQL per a clients.'
  const solutionText = 'CREATE TABLE clients (id INT PRIMARY KEY, nom VARCHAR(100));'

  it("conte el text de l'enunciat", () => {
    const prompt = buildAssessmentSpecPrompt(examText, solutionText)
    expect(prompt).toContain(examText)
  })

  it('conte el text del solucionari', () => {
    const prompt = buildAssessmentSpecPrompt(examText, solutionText)
    expect(prompt).toContain(solutionText)
  })

  it('demana output JSON', () => {
    const prompt = buildAssessmentSpecPrompt(examText, solutionText)
    expect(prompt).toContain('JSON')
  })

  it('el prompt es en catala (conte paraules clau catalanes)', () => {
    const prompt = buildAssessmentSpecPrompt(examText, solutionText)
    expect(prompt).toContain('Respon')
    expect(prompt).toContain('array')
    expect(prompt).toContain('ENUNCIAT')
    expect(prompt).toContain('SOLUCIONARI')
  })

  it('indica que cal respondre unicament amb array JSON sense markdown', () => {
    const prompt = buildAssessmentSpecPrompt(examText, solutionText)
    expect(prompt).toContain('\u00danicament'.toUpperCase())
    expect(prompt).toContain('markdown')
  })
})
