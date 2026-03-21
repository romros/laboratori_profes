import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { handleFeature0AnalysisPdfStub } from '../../../src/features/template-inference/server/feature0AnalysisPdfHandler'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pdfDir = join(__dirname, '../../fixtures/template-inference/pdf')

describe('Feature 0 — PDF reals (stub + heuristica de nom)', () => {
  it('enunciat DAW: stub retorna ok amb regions (text llarg sense sentinels)', async () => {
    const buf = readFileSync(join(pdfDir, 'enunciat-daw.pdf'))
    const res = await handleFeature0AnalysisPdfStub(buf, 'enunciat-daw.pdf')
    expect(res.status).toBe('ok')
    if (res.status === 'ok') {
      expect(res.answer_regions.length).toBeGreaterThanOrEqual(1)
      const first = res.answer_regions[0]
      expect(first.question_id).toBeTruthy()
      expect(first.page).toBeGreaterThanOrEqual(1)
    }
  })

  it('solucio: nom de fitxer força draft barrejat → ko coherent', async () => {
    const buf = readFileSync(join(pdfDir, 'solucio.pdf'))
    const res = await handleFeature0AnalysisPdfStub(buf, 'solucio.pdf')
    expect(res.status).toBe('ko')
    if (res.status === 'ko') {
      expect(res.reasons.some((r) => r.includes('barrejats'))).toBe(true)
    }
  })

  it('mateix PDF solucio amb nom neutre: stub tracta com a plantilla “llarga” (no equivalencia amb solucio)', async () => {
    const buf = readFileSync(join(pdfDir, 'solucio.pdf'))
    const res = await handleFeature0AnalysisPdfStub(buf, 'document-neutre.pdf')
    expect(res.status).toBe('ok')
  })
})
