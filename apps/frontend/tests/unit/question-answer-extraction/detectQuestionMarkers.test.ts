import { describe, expect, it } from 'vitest'

import {
  dedupeQuestionMarkersByFirstId,
  findQuestionMarkers,
  type QuestionMarkerHit,
} from '../../../src/features/question-answer-extraction/services/detectQuestionMarkers'
import {
  segmentByQuestionMarkers,
  stripLeadingQuestionStatement,
  stripTrailingBoilerplateLines,
  truncateOversizedSlice,
} from '../../../src/features/question-answer-extraction/services/segmentByQuestionMarkers'

describe('findQuestionMarkers', () => {
  it('detecta numeracio 1. 2) i Pregunta N', () => {
    const text = `
<<<PAGE 1>>>
1. Primera resposta amb text suficient per passar el llindar minim.
2) Segona amb contingut també vàlid aquí.
Pregunta 3 Encara més text per la tercera part.
`
    const m = findQuestionMarkers(text)
    expect(m.map((x) => x.question_id)).toEqual(['1', '2', '3'])
  })

  it("detecta marcadors sense punt quan segueix paraula d'enunciat (OCR brut)", () => {
    const text = `
<<<PAGE 1>>>
1. Creació de la taula Biblioteca.
2. Creació de la taula Soci.
<<<PAGE 2>>>
4 creació de ha tala
<<<PAGE 3>>>
5 Creació de ia ta Reserva
6 Creació Oe la taula Multa
`
    const m = findQuestionMarkers(text)
    const ids = m.map((x) => x.question_id)
    expect(ids).toContain('1')
    expect(ids).toContain('2')
    expect(ids).toContain('4')
    expect(ids).toContain('5')
    expect(ids).toContain('6')
  })

  it("no genera fals positiu amb numeros solts sense paraula d'enunciat", () => {
    const text = `
<<<PAGE 1>>>
1. Resposta correcta.
El valor 42 no hauria de ser marcador.
Hi ha 3 taules i 15 columnes.
`
    const m = findQuestionMarkers(text)
    expect(m.map((x) => x.question_id)).toEqual(['1'])
  })

  it('deduplicacio proxima: no duplica si regex estricte i tolerant cauen al mateix lloc', () => {
    const text = `
1. Creació de la taula Foo.
`
    const m = findQuestionMarkers(text)
    const ones = m.filter((x) => x.question_id === '1')
    expect(ones).toHaveLength(1)
  })

  it('tolerant detecta Inserir, Assignar, Esborrar, Registrar', () => {
    const text = `
7 Inserir un hospital
8 Assignar una habitacio
9 Esborrar totes les visites
10 Registrar una visita
`
    const m = findQuestionMarkers(text)
    expect(m.map((x) => x.question_id)).toEqual(['7', '8', '9', '10'])
  })
})

describe('dedupeQuestionMarkersByFirstId', () => {
  it('conserva nomes la primera aparicio per question_id', () => {
    const markers: QuestionMarkerHit[] = [
      { question_id: '1', index: 10, matchLength: 3 },
      { question_id: '8', index: 100, matchLength: 3 },
      { question_id: '8', index: 5000, matchLength: 3 },
      { question_id: '9', index: 6000, matchLength: 3 },
    ]
    const d = dedupeQuestionMarkersByFirstId(markers)
    expect(d.map((x) => x.question_id)).toEqual(['1', '8', '9'])
  })
})

describe('stripTrailingBoilerplateLines', () => {
  it('elimina peus institucionals tipics', () => {
    const s = 'Resposta SQL aqui.\n\nGeneralitat de Catalunya'
    expect(stripTrailingBoilerplateLines(s)).toBe('Resposta SQL aqui.')
  })

  it('elimina peu de pagina OCR brut (Pagina N de M)', () => {
    const s = 'SELECT * FROM taula\n\nPàgina 3 de 6'
    expect(stripTrailingBoilerplateLines(s)).toBe('SELECT * FROM taula')
  })

  it('elimina linia Es demana al final', () => {
    const s = 'Bloc de resposta.\n\nEs demana:'
    expect(stripTrailingBoilerplateLines(s)).toBe('Bloc de resposta.')
  })
})

describe('truncateOversizedSlice', () => {
  it('talla en limit de caracters amb nota si cal', () => {
    const filler = 'x'.repeat(5000)
    const out = truncateOversizedSlice(filler)
    expect(out.length).toBeLessThan(filler.length)
    expect(out).toMatch(/spike pas 2/)
  })

  it('prefereix tall abans de canvi de pagina dins del limit', () => {
    const a = 'a'.repeat(2000)
    const b = 'b'.repeat(2000)
    const slice = `${a}\n<<<PAGE 2>>>\n${b}`
    const out = truncateOversizedSlice(slice)
    expect(out).toMatch(/canvi de pàgina|tall al canvi/)
    expect(out).not.toContain('bbbb')
    expect(out.length).toBeLessThan(slice.length)
  })
})

describe('stripLeadingQuestionStatement', () => {
  it('elimina linia inicial amb puntuacio (X punts)', () => {
    const block =
      'Creació de la taula Biblioteca amb les restriccions corresponents. (0.75 punts)\nCREATE TABLE Biblioteca (\nid INT PRIMARY KEY\n);'
    const result = stripLeadingQuestionStatement(block)
    expect(result).not.toContain('0.75 punts')
    expect(result).toContain('CREATE TABLE')
  })

  it('elimina enunciat amb puntuacio OCR brut (punts tallat)', () => {
    const block =
      'Inserir un hospital amb codi 1 ubicat al carrer Sant Joan. (0,33 punts) Sal\n233\n: 3\n4322 23344).'
    const result = stripLeadingQuestionStatement(block)
    expect(result).not.toContain('Inserir un hospital')
    expect(result).toContain('233')
  })

  it('conserva tot si no hi ha patro de puntuacio', () => {
    const block = 'CREATE TABLE foo (\nid INT PRIMARY KEY\n);'
    const result = stripLeadingQuestionStatement(block)
    expect(result).toBe(block)
  })

  it('conserva tot si treure enunciat deixa menys de 20 chars', () => {
    const block = 'Creació de la taula. (0.75 punts)\nOK'
    const result = stripLeadingQuestionStatement(block)
    expect(result).toBe(block)
  })

  it('elimina multiples linies consecutives si totes tenen puntuacio', () => {
    const block =
      'Creació de la taula Soci. (0,75 punts)\nAmb restriccions. (0,5 punts)\nCREATE TABLE Soci (\nid INT PRIMARY KEY\n);'
    const result = stripLeadingQuestionStatement(block)
    expect(result).not.toContain('0,75 punts')
    expect(result).not.toContain('0,5 punts')
    expect(result).toContain('CREATE TABLE')
  })
})

describe('segmentByQuestionMarkers', () => {
  it('assigna page_indices i extreu blocs', () => {
    const text = `
<<<PAGE 1>>>
1. Resposta llarga prou bona per ser ok.
<<<PAGE 2>>>
2. Una altra resposta amb text vàlid aquí.
`
    const markers = findQuestionMarkers(text)
    const items = segmentByQuestionMarkers(text, markers)
    expect(items).toHaveLength(2)
    expect(items[0].question_id).toBe('1')
    expect(items[0].page_indices.sort((a, b) => a - b)).toEqual([1, 2])
    expect(items[0].status).toBe('ok')
    expect(items[1].question_id).toBe('2')
    expect(items[1].page_indices).toContain(2)
  })

  it('pipeline amb deduplicacio: una entrada per question_id repetit', () => {
    const text = `
<<<PAGE 1>>>
8. Primera vuit.
<<<PAGE 2>>>
8. Duplicat peu OCR vuit.
9. Nove.
`
    const raw = findQuestionMarkers(text)
    const markers = dedupeQuestionMarkersByFirstId(raw)
    expect(raw.length).toBeGreaterThan(markers.length)
    const items = segmentByQuestionMarkers(text, markers)
    const ids = items.map((i) => i.question_id)
    expect(ids.filter((x) => x === '8')).toHaveLength(1)
    expect(ids).toContain('9')
  })
})
