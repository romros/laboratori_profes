import { describe, expect, it } from 'vitest'

import { buildAssessmentSpecPrompt } from '../../../src/features/assessment-spec-builder/services/buildAssessmentSpecPrompt'

describe('buildAssessmentSpecPrompt', () => {
  const examText =
    'Pregunta 1 (1 punt): Explica breument dues causes de la Revolució Francesa segons el text base.'
  const solutionText =
    'Resposta model: crisi del règim i de la hisenda reial; desigualtat social i malestar popular.'

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

  it('recorda que els camps llista han de ser arrays JSON (no string sol)', () => {
    const prompt = buildAssessmentSpecPrompt(examText, solutionText)
    expect(prompt).toContain('teacher_style_notes')
    expect(prompt).toMatch(/arrays? JSON|array JSON/i)
  })

  it('enmarca el domini com a generic; SQL nomes com a exemple opcional', () => {
    const prompt = buildAssessmentSpecPrompt(examText, solutionText)
    expect(prompt).toMatch(/genèric|domini del material/i)
    expect(prompt).toMatch(/no assumeixis|no hi ha llista tancada|text lliure coherent/i)
    expect(prompt).toMatch(/sql_ddl|sql_insert/i)
    expect(prompt).toMatch(/il·lustratiu|adequad/i)
  })
})
