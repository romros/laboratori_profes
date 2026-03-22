/**
 * Comprovació mínima: presència de la seqüència `%PDF` als primers bytes (no valida l’estructura sencera).
 */
export function isLikelyPdfBuffer(buffer: Buffer): boolean {
  const lim = Math.min(buffer.length, 2048)
  if (lim < 5) return false
  for (let i = 0; i <= lim - 5; i++) {
    if (
      buffer[i] === 0x25 &&
      buffer[i + 1] === 0x50 &&
      buffer[i + 2] === 0x44 &&
      buffer[i + 3] === 0x46
    ) {
      return true
    }
  }
  return false
}
