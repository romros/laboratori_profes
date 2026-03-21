import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { extractPdfContent } from '../../../src/features/template-inference/services/extractPdfContent'

const dir = dirname(fileURLToPath(import.meta.url))
const pdfDir = join(dir, '../../fixtures/template-inference/pdf')

describe('extractPdfContent', () => {
  it('extreu text del PDF enunciat (fixture)', async () => {
    const buf = readFileSync(join(pdfDir, 'enunciat-daw.pdf'))
    const out = await extractPdfContent(buf)
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.pageCount).toBeGreaterThanOrEqual(1)
      expect(out.text.length).toBeGreaterThan(500)
    }
  })

  it('rebutja buffer que no es PDF', async () => {
    const out = await extractPdfContent(Buffer.from('not a pdf'))
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.error.length).toBeGreaterThan(5)
    }
  })
})
