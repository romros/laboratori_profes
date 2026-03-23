import { describe, it, expect } from 'vitest'

import { cleanAnswerZoneLines } from '../../../src/features/template-answer-zones/cleanAnswerZoneText'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function clean(lines: string[], docLines?: string[]): string[] {
  return cleanAnswerZoneLines(lines, docLines ?? lines)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('cleanAnswerZoneLines', () => {
  // --- Capçaleres institucionals ---

  it('elimina "Generalitat de Catalunya"', () => {
    const result = clean(['Generalitat de Catalunya', 'CREATE TABLE foo (id INT)'])
    expect(result).not.toContain('Generalitat de Catalunya')
    expect(result).toContain('CREATE TABLE foo (id INT)')
  })

  it('elimina "Departament d\'Ensenyament"', () => {
    const result = clean(["Departament d'Ensenyament", 'INSERT INTO foo VALUES (1)'])
    expect(result).not.toContain("Departament d'Ensenyament")
  })

  it('elimina "INS Francesc Vidal i Barraquer"', () => {
    const result = clean(['INS Francesc Vidal i Barraquer', 'SELECT * FROM foo'])
    expect(result).not.toContain('INS Francesc Vidal i Barraquer')
  })

  it('elimina "AVALUACIÓ" sol', () => {
    const result = clean(['AVALUACIÓ', 'ALTER TABLE foo ADD col INT'])
    expect(result).not.toContain('AVALUACIÓ')
  })

  // --- Numeració de pàgina ---

  it('elimina "Pàgina 1 de 6"', () => {
    const result = clean(['Pàgina 1 de 6', 'CREATE TABLE bar (x INT)'])
    expect(result).not.toContain('Pàgina 1 de 6')
  })

  it('elimina "Pagina 3 de 6" (sense accent)', () => {
    const result = clean(['Pagina 3 de 6', 'DELETE FROM foo WHERE id=1'])
    expect(result).not.toContain('Pagina 3 de 6')
  })

  // --- Separadors gràfics ---

  it('elimina línies de guions "-----"', () => {
    const result = clean(['----------', 'UPDATE foo SET x=1'])
    expect(result).not.toContain('----------')
  })

  it('elimina línies de tirets llargs "————"', () => {
    const result = clean(['————————', 'INSERT INTO foo VALUES (2)'])
    expect(result).not.toContain('————————')
  })

  // --- Fragments d'enunciat residuals ---

  it('elimina enunciat residual "1. Creació Taula Hospital..."', () => {
    const result = clean(['1. Creació Taula Hospital amb les restriccions.', 'PRIMARY KEY (id)'])
    expect(result).not.toContain('1. Creació Taula Hospital amb les restriccions.')
  })

  it('elimina enunciat residual "2. Inserir un pacient..."', () => {
    const result = clean(['2. Inserir un pacient...', 'INSERT INTO pacient VALUES (1)'])
    expect(result).not.toContain('2. Inserir un pacient...')
  })

  it('elimina "3. Assignar una habitació..."', () => {
    const result = clean(['3. Assignar una habitació', 'INSERT INTO habitacio VALUES (101)'])
    expect(result).not.toContain('3. Assignar una habitació')
  })

  // --- Protecció SQL ---

  it('manté CREATE TABLE malgrat tenir paraula eliminar prop', () => {
    const lines = ['CREATE TABLE visita (', '  id INT PRIMARY KEY', ')']
    expect(clean(lines)).toEqual(lines)
  })

  it('manté INSERT INTO sempre', () => {
    const lines = ['INSERT INTO pacient VALUES (1, "Pere")']
    expect(clean(lines)).toEqual(lines)
  })

  it('manté DELETE FROM (SQL, no boilerplate)', () => {
    const lines = ['DELETE FROM visita WHERE tipus = "consulta"']
    expect(clean(lines)).toEqual(lines)
  })

  it('manté ALTER TABLE', () => {
    const lines = ['ALTER TABLE pacient ADD cep VARCHAR(6) NOT NULL']
    expect(clean(lines)).toEqual(lines)
  })

  // --- Línies repetides ---

  it('elimina línia curta repetida ≥ 3 cops al document', () => {
    const docLines = [
      'INS Francesc Vidal',
      'CREATE TABLE foo (id INT)',
      'capcalera repetida',
      'capcalera repetida',
      'capcalera repetida',
      'INSERT INTO foo VALUES (1)',
    ]
    const zoneLines = ['capcalera repetida', 'INSERT INTO foo VALUES (1)']
    const result = cleanAnswerZoneLines(zoneLines, docLines)
    expect(result).not.toContain('capcalera repetida')
    expect(result).toContain('INSERT INTO foo VALUES (1)')
  })

  it('no elimina línia curta repetida < 3 cops', () => {
    const docLines = [
      'codi repetit dos cops',
      'codi repetit dos cops',
      'INSERT INTO foo VALUES (1)',
    ]
    const zoneLines = ['codi repetit dos cops', 'INSERT INTO foo VALUES (1)']
    const result = cleanAnswerZoneLines(zoneLines, docLines)
    expect(result).toContain('codi repetit dos cops')
  })

  // --- Conservadorisme ---

  it('manté text únic desconegut (conservador)', () => {
    const lines = ['resposta manuscrita única sense pattern']
    expect(clean(lines)).toEqual(lines)
  })

  it('elimina línies buides', () => {
    const lines = ['', '  ', 'CREATE TABLE foo (id INT)', '']
    const result = clean(lines)
    expect(result).not.toContain('')
    expect(result).not.toContain('  ')
    expect(result).toContain('CREATE TABLE foo (id INT)')
  })

  it('resultat buit si tot era boilerplate', () => {
    const lines = ['Generalitat de Catalunya', 'Pàgina 2 de 6', 'INS Francesc Vidal i Barraquer']
    expect(clean(lines)).toHaveLength(0)
  })
})
