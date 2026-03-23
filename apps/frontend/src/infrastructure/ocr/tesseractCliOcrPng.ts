import { execFile } from 'node:child_process'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const DEFAULT_LANGS = 'cat'

/**
 * OCR per pàgina (PNG) via Tesseract CLI natiu.
 * Mateixa interfície que `ocrPngBuffersWithTesseract` (tesseract.js WASM).
 *
 * Requereix `tesseract` instal·lat al sistema (apk add tesseract-ocr).
 * Cada pàgina es desa a un fitxer temporal, s'executa el CLI i es llegeix la sortida.
 */
export async function ocrPngBuffersWithTesseractCli(
  pngPages: Buffer[],
  langs: string = DEFAULT_LANGS,
): Promise<string[]> {
  if (pngPages.length === 0) return []

  const tmpDir = await mkdtemp(join(tmpdir(), 'qae-ocr-'))
  try {
    const texts: string[] = []
    for (let i = 0; i < pngPages.length; i++) {
      const pngPath = join(tmpDir, `page_${i}.png`)
      const outBase = join(tmpDir, `page_${i}_out`)
      const txtPath = `${outBase}.txt`

      await writeFile(pngPath, pngPages[i]!)
      await execFileAsync('tesseract', [pngPath, outBase, '-l', langs, '--psm', '3'])
      const text = await readFile(txtPath, 'utf8')
      texts.push(text)
    }
    return texts
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
}
