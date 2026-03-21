/**
 * Normalització estructural mínima del payload LLM (sense negoci, sense inferències).
 * Claus opcionals que han de ser arrays: si falten o són null/undefined → [].
 * Tipus incorrecte: es deixa igual; el validator fallarà (fail-closed).
 */

const OPTIONAL_ARRAY_KEYS = [
  'reasons',
  'limitations',
  'header_regions',
  'exercise_regions',
  'proposed_limitations',
] as const

export function normalizeTemplateDraft(input: unknown): unknown {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return input
  }

  const draft = structuredClone(input) as Record<string, unknown>

  for (const key of OPTIONAL_ARRAY_KEYS) {
    const v = draft[key]
    if (!(key in draft) || v === undefined || v === null) {
      draft[key] = []
    }
  }

  return draft
}
