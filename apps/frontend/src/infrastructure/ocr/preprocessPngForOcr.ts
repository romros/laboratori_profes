import { createCanvas, loadImage } from '@napi-rs/canvas'

/**
 * Preprocessing de PNG abans d'OCR.
 *
 * Transformacions aplicades (en ordre):
 *   1. Grayscale — elimina soroll de color
 *   2. Contrast boosting — realça diferències clar/fosc
 *   3. Threshold (binarització) — converteix a blanc/negre pur
 *
 * Disseny: sense dependències noves (@napi-rs/canvas ja és transitiu de pdf-parse).
 * Només transformacions simples i reversibles.
 *
 * Si el preprocessing empitjora un cas, es pot desactivar passant `enabled: false`.
 */

export type PreprocessOptions = {
  /** Umbral de binarització 0–255. Default 128. */
  threshold?: number
  /** Factor de contrast [-1, 1]. Positiu = més contrast. Default 0.3. */
  contrast?: number
}

const DEFAULT_OPTS: Required<PreprocessOptions> = {
  threshold: 128,
  contrast: 0.3,
}

/**
 * Aplica grayscale + contrast boost + threshold a un buffer PNG.
 * Retorna un nou buffer PNG preprocesasat.
 */
export async function preprocessPngForOcr(
  pngBuffer: Buffer,
  opts: PreprocessOptions = {},
): Promise<Buffer> {
  const { threshold, contrast } = { ...DEFAULT_OPTS, ...opts }

  const img = await loadImage(pngBuffer)
  const canvas = createCanvas(img.width, img.height)
  const ctx = canvas.getContext('2d')

  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, img.width, img.height)
  const data = imageData.data // RGBA, 4 bytes per píxel

  // Factor de contrast: aplica la fórmula estàndard
  const contrastFactor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!
    const g = data[i + 1]!
    const b = data[i + 2]!

    // 1. Grayscale (luminance)
    let gray = 0.299 * r + 0.587 * g + 0.114 * b

    // 2. Contrast boost
    gray = Math.min(255, Math.max(0, contrastFactor * (gray - 128) + 128))

    // 3. Threshold (binarització)
    const bin = gray >= threshold ? 255 : 0

    data[i] = bin
    data[i + 1] = bin
    data[i + 2] = bin
    // alpha es conserva
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toBuffer('image/png')
}
