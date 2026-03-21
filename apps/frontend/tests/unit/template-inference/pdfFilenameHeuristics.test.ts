import { describe, expect, it } from 'vitest'

import { looksLikeSolutionPdfFilename } from '../../../src/features/template-inference/server/pdfFilenameHeuristics'

describe('looksLikeSolutionPdfFilename', () => {
  it('detecta noms tipics de solucio', () => {
    expect(looksLikeSolutionPdfFilename('Examen-solucio.pdf')).toBe(true)
    expect(looksLikeSolutionPdfFilename('carpeta/Solucion final.pdf')).toBe(true)
    expect(looksLikeSolutionPdfFilename('pack/Solució.pdf')).toBe(true)
    expect(
      looksLikeSolutionPdfFilename(
        'F_IT_008_01_Examen_2526_A3 LDD_Ordinaria_Enunciat3 - hospital - Solució.pdf',
      ),
    ).toBe(true)
  })

  it('no marca enunciat DAW generic', () => {
    expect(looksLikeSolutionPdfFilename('enunciat-daw.pdf')).toBe(false)
    expect(looksLikeSolutionPdfFilename('F_IT_008_enunciat.pdf')).toBe(false)
  })
})
