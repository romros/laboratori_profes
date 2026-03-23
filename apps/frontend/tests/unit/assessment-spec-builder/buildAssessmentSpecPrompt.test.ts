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

  it('exigeix JSON estricte sense text fora ni markdown', () => {
    const prompt = buildAssessmentSpecPrompt(examText, solutionText)
    expect(prompt).toMatch(/NOM\u00c9S amb un array JSON|Respon NOM\u00c9S/i)
    expect(prompt).toMatch(/fora del JSON|cap text fora/i)
    expect(prompt).toMatch(/markdown/i)
  })

  it('recorda que els camps llista han de ser arrays JSON (no string sol)', () => {
    const prompt = buildAssessmentSpecPrompt(examText, solutionText)
    expect(prompt).toContain('teacher_style_notes')
    expect(prompt).toMatch(/arrays? JSON|array JSON/i)
  })

  it('normes estrictes: no inventar preguntes, alineació, extracció vs inferència, límits', () => {
    const prompt = buildAssessmentSpecPrompt(examText, solutionText)
    expect(prompt).toContain('No inventis preguntes')
    expect(prompt).toContain('No barregis')
    expect(prompt).toContain('Extracció vs inferència')
    expect(prompt).toContain('com a màxim 3 a 5 elements')
    expect(prompt).toContain('com a màxim 2 o 3 strings')
    expect(prompt).toContain('unknown')
    expect(prompt).toContain('sql_ddl')
    expect(prompt).toMatch(/Evita criteris gen\u00e8rics|observable o verificable/i)
    expect(prompt).toMatch(/subpuntuacions|r\u00fabrica num\u00e8rica/i)
  })

  it('context FP i tecniques (sense centrar el producte en SQL)', () => {
    const prompt = buildAssessmentSpecPrompt(examText, solutionText)
    expect(prompt).toContain('FP')
    expect(prompt).toContain('cicles formatius')
    expect(prompt).toContain("no assumeixis SQL si l'enunciat no ho és")
  })

  it('MODE OPERATIU: conté bloc de prohibicions explícites de passada 1', () => {
    const prompt = buildAssessmentSpecPrompt(examText, solutionText)
    // Bloc mode operatiu present
    expect(prompt).toContain('MODE OPERATIU')
    expect(prompt).toContain('ROL: PARSER FIDEL')
    // Prohibicions explícites
    expect(prompt).toMatch(/No inventis elements/i)
    expect(prompt).toMatch(/No completis informaci[oó] que falti/i)
    expect(prompt).toMatch(/No dedu\w+xis estructures|No dedueixis/i)
    expect(prompt).toMatch(/No apliquis criteri docent/i)
    expect(prompt).toMatch(/No reescriguis|text literal de l'enunciat/i)
    // Prioritat fidelitat sobre completesa
    expect(prompt).toMatch(/fidelitat documental.*completesa|prioritat.*fidelitat/i)
  })
})
