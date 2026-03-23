/**
 * Normalitza text per a matching tolerant OCR:
 * - lowercase
 * - elimina accents (NFD + strip combining)
 * - elimina puntuació bàsica
 * - col·lapsa espais
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;:!?()[\]{}'"""''*_\-/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extreu paraules significatives (longitud ≥ 4) d'un text normalitzat.
 * Paraules curtes (articles, preposicions) aporten poc al matching.
 */
export function keywordsOf(normalizedText: string): string[] {
  return normalizedText.split(' ').filter((w) => w.length >= 4)
}
