import { describe, expect, it } from 'vitest'

import { detectSemanticOcrQuality } from '../../../src/features/answer-evaluator/services/detectSemanticOcrQuality'

// ── Casos bons (usable) ────────────────────────────────────────────────────────

describe('detectSemanticOcrQuality — casos usable', () => {
  it('SQL net i complet → usable', () => {
    const result = detectSemanticOcrQuality(`CREATE TABLE Hospital (
  codi INT PRIMARY KEY,
  cp CHAR(5) NOT NULL,
  carrer VARCHAR(120) NOT NULL,
  numero INT NOT NULL CHECK (numero > 0),
  telefon VARCHAR(20) NOT NULL
);`)
    expect(result.quality).toBe('usable')
    expect(result.sqlFuzzySignalCount).toBeGreaterThanOrEqual(2)
  })

  it('SQL amb variants OCR lleus recognoscibles → usable', () => {
    // CREAT TABL (en comptes de CREATE TABLE) — variant OCR típica
    const result = detectSemanticOcrQuality(`CREAT TABL Tractament (
  idTractament INT PRIMAR KEY,
  nomTractament VARCHAR(100),
  nifPacient CHAR(9) REFERENC Pacient(nif)
)`)
    expect(result.quality).toBe('usable')
    expect(result.sqlFuzzySignalCount).toBeGreaterThanOrEqual(2)
  })

  it('INSERT INTO → usable', () => {
    const result = detectSemanticOcrQuality(
      "INSERT INTO Pacient VALUES ('12345678A', 'Joan', 'Puig', '08001')",
    )
    expect(result.quality).toBe('usable')
    expect(result.sqlFuzzySignalCount).toBeGreaterThanOrEqual(2)
  })

  it('SELECT amb WHERE → usable', () => {
    const result = detectSemanticOcrQuality('SELECT nom, cognoms FROM Pacient WHERE cp = 08001')
    expect(result.quality).toBe('usable')
  })

  it('OCR lleugerament brut però recognoscible → usable', () => {
    // Alguns caràcters malmesos però estructura SQL clara
    const result = detectSemanticOcrQuality(`CREATE TABLE Pacient (
  nif CHAR(9) PRIMANY KEY,
  nom VARCHAR(100) NOT NULIL,
  cognoms VARCHAR(150) NOT NULL
)`)
    expect(result.quality).toBe('usable')
  })

  it('CREAT TABLE amb identificadors reals → usable', () => {
    const result = detectSemanticOcrQuality(
      'CREAT TABLE Hospital codi INT PRIMARY KEY cp CHAR NOT NULL',
    )
    expect(result.quality).toBe('usable')
  })
})

// ── Casos clarament il·legibles (unreadable) ──────────────────────────────────

describe('detectSemanticOcrQuality — casos unreadable', () => {
  it('text corrupte clàssic Spike 3.D alumne-2 Q1 → unreadable', () => {
    // Text real OCR del Spike 3.D — tokens morfològicament "plausibles" però 0 senyals SQL
    // La detecció és per absència de senyal SQL, no per gibberish de caràcters
    const result = detectSemanticOcrQuality(`CRERTE T10y5. ferp ll
Corda VT PO MN Y CEY AC LA OU L,
da (UT LCT AJULL,
Co vu en VARCHAQ (2) or AULL,
PUMEO (VT AdT AUULL, I
idelem VARCMAL MI) vot AULL,
CH EcCIe (meumenc YO)
Ps`)
    expect(result.quality).toBe('unreadable')
    // No té senyal SQL reconeixible — cap token fuzzy SQL detectat
    expect(result.sqlFuzzySignalCount).toBe(0)
  })

  it('VBRCHBR — token clarament gibberish → contribueix a unreadable', () => {
    // VBRCHBR: 0 vocals de 6 lletres = 0% → gibberish
    // NRRCHAR: 1/6 = 17% → gibberish  BQQZ: 0/4 = 0% → gibberish
    // MNCXVZ: 0/6 = 0% → gibberish  FRERP: 1/5 = 20% → borderline/gibberish
    const result = detectSemanticOcrQuality('VBRCHBR NRRCHAR PRYMAY KYYY TY FRERP BQQZ MNCXVZ')
    expect(['unreadable', 'uncertain']).toContain(result.quality)
    expect(result.gibberishRatio).toBeGreaterThan(0.5)
  })

  it('text llarg però completament corrupte → unreadable', () => {
    const result = detectSemanticOcrQuality(
      'CRERTE TBLY HRSPITL KVRT MNTY FRLP VZZT BQQX NRRCH VBRCH JXZT MNVZ KRRB PLTY FRZZ CRPX',
    )
    expect(result.quality).toBe('unreadable')
  })

  it('barreja absurda sense estructura SQL → no usable', () => {
    // Sembla OCR d'un text completament diferent al de la pregunta (capçalera de document)
    // Paraules catalanes reals però sense senyal SQL → no pot ser usable
    const result = detectSemanticOcrQuality(
      'Mcscizrt AVALUACIÓ N INS Francesc Vidal Barraquer de Catalunya escola',
    )
    // Ha de ser uncertain (paraules reals, però no SQL) — mai usable
    expect(result.quality).not.toBe('usable')
    expect(result.sqlFuzzySignalCount).toBe(0)
  })

  it('tokens alfanumèrics barrejats sense intenció SQL → unreadable/uncertain', () => {
    const result = detectSemanticOcrQuality('T10y5 M2x7 NRRCHAR FERP VBRC TBLY KRRT')
    expect(['unreadable', 'uncertain']).toContain(result.quality)
    expect(result.sqlFuzzySignalCount).toBe(0)
  })
})

// ── Casos incerts (uncertain) ─────────────────────────────────────────────────

describe('detectSemanticOcrQuality — casos uncertain', () => {
  it('text curt sense suficients tokens → uncertain', () => {
    const result = detectSemanticOcrQuality('INT KEY')
    expect(result.quality).toBe('uncertain')
  })

  it('OCR molt degradat però amb 1 senyal SQL → uncertain', () => {
    // Només 1 token SQL clar (INT), resta corrupte
    const result = detectSemanticOcrQuality('FRZZ BQQX INT NRRCH VBRCH JXZT')
    // Depèn de si ens arriba a 2 signals — pot ser uncertain
    expect(['uncertain', 'unreadable']).toContain(result.quality)
  })
})

// ── Tests d'heurística isGibberishToken ──────────────────────────────────────

describe('detectSemanticOcrQuality — heurística gibberish', () => {
  it('tokens reals SQL no han de ser gibberish', () => {
    // Verificació indirecta: textos amb tokens SQL reals → ratio baix
    const result = detectSemanticOcrQuality(
      'CREATE TABLE Hospital codi INT cp VARCHAR carrer numero telefon',
    )
    expect(result.gibberishRatio).toBeLessThan(0.2)
  })

  it('text dominat per consonants consecutives → gibberish alt', () => {
    // VBRCHBR, NRRCHAR, CRERTE (CRERTE té 'rte' que té vocal al mig, però VBRCHBR no)
    const result = detectSemanticOcrQuality('VBRCHBR NRRCHAR BQQZ MNCXVZ JXZT KRRB PLTZ')
    expect(result.gibberishRatio).toBeGreaterThan(0.5)
  })

  it('patró alfanumèric mixt (T10y5) → contribueix a gibberish', () => {
    const result = detectSemanticOcrQuality('T10y5 C0d3 M2x7 Z9y4 A8b1')
    expect(result.gibberishRatio).toBeGreaterThan(0.5)
  })
})

// ── Estructura del resultat ───────────────────────────────────────────────────

describe('detectSemanticOcrQuality — estructura retorn', () => {
  it('sempre retorna els 4 camps', () => {
    const result = detectSemanticOcrQuality('CREATE TABLE Hospital (codi INT PRIMARY KEY)')
    expect(result).toHaveProperty('quality')
    expect(result).toHaveProperty('reason')
    expect(result).toHaveProperty('sqlFuzzySignalCount')
    expect(result).toHaveProperty('gibberishRatio')
    expect(result).toHaveProperty('plausibleIdentifierRatio')
    expect(typeof result.reason).toBe('string')
    expect(result.reason.length).toBeGreaterThan(0)
  })

  it('gibberishRatio entre 0 i 1', () => {
    const result = detectSemanticOcrQuality('CREATE TABLE Hospital (codi INT PRIMARY KEY)')
    expect(result.gibberishRatio).toBeGreaterThanOrEqual(0)
    expect(result.gibberishRatio).toBeLessThanOrEqual(1)
  })

  it('plausibleIdentifierRatio entre 0 i 1', () => {
    const result = detectSemanticOcrQuality('VBRCHBR NRRCHAR BQQZ')
    expect(result.plausibleIdentifierRatio).toBeGreaterThanOrEqual(0)
    expect(result.plausibleIdentifierRatio).toBeLessThanOrEqual(1)
  })
})
