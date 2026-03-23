/**
 * El model sovint envia un string on el schema exigeix array; coacció mínima abans de Zod.
 */
export const LLM_QUESTION_LIST_FIELD_KEYS = [
  'what_to_evaluate',
  'required_elements',
  'accepted_variants',
  'important_mistakes',
  'teacher_style_notes',
] as const

export function normalizeLlmQuestionListFields(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return raw
  }
  const o = { ...(raw as Record<string, unknown>) }
  for (const key of LLM_QUESTION_LIST_FIELD_KEYS) {
    const v = o[key]
    if (typeof v === 'string') {
      const t = v.trim()
      o[key] = t.length === 0 ? [] : [t]
    } else if (v == null) {
      o[key] = []
    }
  }
  return o
}

export function normalizeAssessmentSpecQuestionsInRaw(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null || !('questions' in raw)) {
    return raw
  }
  const o = { ...(raw as Record<string, unknown>) }
  const qs = o.questions
  if (!Array.isArray(qs)) {
    return raw
  }
  o.questions = qs.map(normalizeLlmQuestionListFields)
  return o
}
