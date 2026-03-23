import { describe, expect, it } from 'vitest'

import { buildEnrichAssessmentSpecPrompt } from '../../../src/features/assessment-spec-builder/services/enrichAssessmentSpecPrompt'
import {
  hospitalDawExamText,
  hospitalDawSolutionText,
} from '../../fixtures/assessment-spec-builder/hospitalDawGolden'

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

  it('amb fixture hospital real: enunciat i solucionari al cos del prompt (blocs ORIGINAL; cablejat 2.1b)', () => {
    const prompt = buildEnrichAssessmentSpecPrompt({
      specJson: '{"exam_id":"golden"}',
      examText: hospitalDawExamText,
      solutionText: hospitalDawSolutionText,
    })
    expect(prompt).toContain('## ENUNCIAT ORIGINAL')
    expect(prompt).toContain('## SOLUCIONARI ORIGINAL')
    expect(prompt).toContain('F_IT_008_01 — Examen LDD Ordinària — Cas Hospital (DAW)')
    expect(prompt).toContain('SOLUCIONARI — Examen Hospital (DAW)')
    expect(prompt).toContain('Creació Taula 1 (Hospital)')
    expect(prompt).toContain('CREATE TABLE Hospital')
  })

  it('sense examText ni solutionText: placeholders explícits (no inventar context)', () => {
    const prompt = buildEnrichAssessmentSpecPrompt({ specJson: '{}' })
    expect(prompt).toContain("(no s'ha facilitat text d'enunciat")
    expect(prompt).toContain("(no s'ha facilitat solucionari")
  })

  it('inclou bloc CONTEXT_DOCUMENT_PROFESSOR quan es passa examDocumentContext', () => {
    const prompt = buildEnrichAssessmentSpecPrompt({
      specJson: '{}',
      examDocumentContext: 'Hospital(codi, cp, carrer)',
    })
    expect(prompt).toContain('## CONTEXT_DOCUMENT_PROFESSOR')
    expect(prompt).toContain('Hospital(codi, cp, carrer)')
  })

  it('placeholder CONTEXT_DOCUMENT_PROFESSOR quan no es passa', () => {
    const prompt = buildEnrichAssessmentSpecPrompt({ specJson: '{}' })
    expect(prompt).toContain('## CONTEXT_DOCUMENT_PROFESSOR')
    expect(prompt).toContain("(no s'ha facilitat context previ del document")
  })

  it('guardrail CONTEXT_DOCUMENT_PROFESSOR explícit al prompt', () => {
    const prompt = buildEnrichAssessmentSpecPrompt({ specJson: '{}' })
    expect(prompt).toMatch(
      /Guardrail CONTEXT_DOCUMENT_PROFESSOR|context del document.*suport interpretatiu/i,
    )
  })

  it("CONTEXT_DOCUMENT_PROFESSOR apareix a l'ordre de lectura", () => {
    const prompt = buildEnrichAssessmentSpecPrompt({ specJson: '{}' })
    expect(prompt).toContain('CONTEXT_DOCUMENT_PROFESSOR')
    // Ordre: context primer, spec base segon
    const idxContext = prompt.indexOf('## CONTEXT_DOCUMENT_PROFESSOR')
    const idxBase = prompt.indexOf('## ASSESSMENT_SPEC_BASE')
    expect(idxContext).toBeLessThan(idxBase)
  })

  it('MODE PEDAGÒGIC: conté bloc de rol docent i acceptació de variants conceptuals', () => {
    const prompt = buildEnrichAssessmentSpecPrompt({ specJson: '{}' })
    // Bloc mode pedagògic present
    expect(prompt).toContain('MODE PEDAGÒGIC')
    expect(prompt).toContain('ROL: LECTOR DOCENT')
    // Acceptació de variants equivalents
    expect(prompt).toMatch(/variants equivalents|variant.*equivalent/i)
    // No literalitat de noms d'implementació
    expect(prompt).toMatch(/no exigeixis literalitat|nom.*implementaci[oó]/i)
    // Validació model conceptual, no sintaxi
    expect(prompt).toMatch(/model conceptual|criteri docent.*variant/i)
    // Distinció passada 1 vs passada 2
    expect(prompt).toMatch(/passada 1.*parser|passada 2.*professor/i)
  })

  it("MODE PEDAGÒGIC: el contracte exigeix accepted_variants per noms no explícits a l'enunciat", () => {
    const prompt = buildEnrichAssessmentSpecPrompt({ specJson: '{}' })
    // No pot exigir com a required_element un nom de taula/columna absent de l'enunciat
    expect(prompt).toMatch(/accepted_variant|accepted_variants/i)
    expect(prompt).toMatch(
      /no.*apareix.*enunciat.*required|nom.*taula.*no.*enunciat|accepted_variant.*no.*required/i,
    )
  })
})
