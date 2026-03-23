import { describe, expect, it } from 'vitest'

import { extractDocumentContext } from '../../../src/features/assessment-spec-builder/services/extractDocumentContext'
import {
  hospitalDawExamDocumentContext,
  hospitalDawExamTextFull,
} from '../../fixtures/assessment-spec-builder/hospitalDawGolden'

describe('extractDocumentContext', () => {
  it('talla pel marcador "Es demana:" i retorna el preàmbul', () => {
    const text = 'Instruccions globals.\n\nEs demana:\n1. Pregunta 1.'
    const result = extractDocumentContext(text)
    expect(result.pre_questions_text).toBe('Instruccions globals.')
    expect(result.questions_start_index).toBeGreaterThan(0)
  })

  it('accepta "Es demana:" amb espais o salts de línia darrere', () => {
    const text = 'Context.\nEs demana:\n1. Q1'
    const result = extractDocumentContext(text)
    expect(result.pre_questions_text).toBe('Context.')
    expect(result.questions_start_index).toBeGreaterThan(0)
  })

  it('el pre_questions_text NO conté el llistat de preguntes numerades', () => {
    const text = 'Model relacional.\nEs demana:\n1. Pregunta 1.\n2. Pregunta 2.'
    const { pre_questions_text } = extractDocumentContext(text)
    expect(pre_questions_text).not.toContain('Pregunta 1')
    expect(pre_questions_text).not.toContain('Pregunta 2')
    expect(pre_questions_text).toContain('Model relacional')
  })

  it('si no hi ha marcador, retorna el text complet i questions_start_index = -1', () => {
    const text = 'Text sense marcador de preguntes.'
    const result = extractDocumentContext(text)
    expect(result.pre_questions_text).toBe(text)
    expect(result.questions_start_index).toBe(-1)
  })

  it('text buit retorna pre_questions_text buit i index -1', () => {
    const result = extractDocumentContext('')
    expect(result.pre_questions_text).toBe('')
    expect(result.questions_start_index).toBe(-1)
  })

  it('és insensible a majúscules/minúscules del marcador', () => {
    const text = 'Context.\nes demana:\n1. Q1'
    const result = extractDocumentContext(text)
    expect(result.pre_questions_text).toBe('Context.')
  })

  // --- Fixture hospital real ---

  it('fixture hospital: pre_questions_text conté el model lògic relacional', () => {
    const { pre_questions_text } = extractDocumentContext(hospitalDawExamTextFull)
    expect(pre_questions_text).toContain('Hospital(codi')
    expect(pre_questions_text).toContain('Pacient(nif')
    expect(pre_questions_text).toContain('Tractament(idTractament')
    expect(pre_questions_text).toContain('Visita(idVisita')
  })

  it('fixture hospital: pre_questions_text conté restriccions globals', () => {
    const { pre_questions_text } = extractDocumentContext(hospitalDawExamTextFull)
    expect(pre_questions_text).toContain('clau forana')
    expect(pre_questions_text).toContain('individual')
    expect(pre_questions_text).toContain('número positiu')
  })

  it('fixture hospital: pre_questions_text NO conté el llistat de preguntes numerades', () => {
    const { pre_questions_text } = extractDocumentContext(hospitalDawExamTextFull)
    expect(pre_questions_text).not.toMatch(/1\.\s+Creació Taula/)
    expect(pre_questions_text).not.toContain('Inserir un hospital')
  })

  it('fixture hospital: questions_start_index > 0 (hi ha preàmbul)', () => {
    const { questions_start_index } = extractDocumentContext(hospitalDawExamTextFull)
    expect(questions_start_index).toBeGreaterThan(0)
  })

  it('fixture hospital: hospitalDawExamDocumentContext coincideix amb el pre_questions_text extret', () => {
    const { pre_questions_text } = extractDocumentContext(hospitalDawExamTextFull)
    expect(pre_questions_text).toBe(hospitalDawExamDocumentContext)
  })
})
