/**
 * Parse defensiu de la sortida textual del model: un sol objecte JSON.
 * No intenta “reparar” JSON trencat ni extreure múltiples objectes.
 */
export function extractJsonObjectFromModelText(raw: string): unknown {
  let s = raw.trim()
  if (s.startsWith('```')) {
    const firstNl = s.indexOf('\n')
    if (firstNl === -1) {
      throw new Error('Resposta del model: bloc de codi incomplet')
    }
    s = s.slice(firstNl + 1)
    const fenceEnd = s.lastIndexOf('```')
    if (fenceEnd !== -1) {
      s = s.slice(0, fenceEnd).trim()
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(s)
  } catch {
    throw new Error('Resposta del model: JSON invàlid')
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Resposta del model: cal un objecte JSON (no array ni null)')
  }

  return parsed
}
