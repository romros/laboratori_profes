import { describe, expect, it } from 'vitest'

import { normalizeTemplateDraft } from '../../../src/features/template-inference/services/templateDraftNormalizer'

describe('normalizeTemplateDraft', () => {
  it('omple arrays opcionals absents amb []', () => {
    const raw = {
      layout_stable: true,
      identity_mixed_with_answer: false,
      identity_reused_as_gradable_content: false,
      single_n_concentrates_majority_grade: false,
      free_text_without_box_main_form: false,
      layout_differs_per_student: false,
      answers_in_undelimited_margins_or_mixed_blocks: false,
      doubt_on_seminanonimitzable: false,
      conflicting_readings: false,
      exercises: [{ exercise_id: 'a', kind: 'd' }],
    }

    const out = normalizeTemplateDraft(raw) as Record<string, unknown>

    expect(Array.isArray(out.proposed_limitations)).toBe(true)
    expect(out.proposed_limitations).toEqual([])
    expect(Array.isArray(out.reasons)).toBe(true)
    expect(Array.isArray(out.limitations)).toBe(true)
    expect(Array.isArray(out.header_regions)).toBe(true)
    expect(Array.isArray(out.exercise_regions)).toBe(true)
  })

  it('no altera valors explícits de negoci (booleans)', () => {
    const raw = {
      layout_stable: false,
      identity_mixed_with_answer: true,
      identity_reused_as_gradable_content: false,
      single_n_concentrates_majority_grade: false,
      free_text_without_box_main_form: false,
      layout_differs_per_student: false,
      answers_in_undelimited_margins_or_mixed_blocks: false,
      doubt_on_seminanonimitzable: false,
      conflicting_readings: false,
      exercises: [{ exercise_id: 'a', kind: 'd' }],
    }

    const out = normalizeTemplateDraft(structuredClone(raw)) as Record<string, unknown>

    expect(out.layout_stable).toBe(false)
    expect(out.identity_mixed_with_answer).toBe(true)
  })

  it('no substitueix proposed_limitations quan ja ve definit', () => {
    const lim = [
      {
        type: 'exclude_numbered_page_section',
        sentence: 'Excloure pàgina 1.',
        page_or_section_ref: '1',
      },
    ]
    const raw = {
      layout_stable: true,
      identity_mixed_with_answer: false,
      identity_reused_as_gradable_content: false,
      single_n_concentrates_majority_grade: false,
      free_text_without_box_main_form: false,
      layout_differs_per_student: false,
      answers_in_undelimited_margins_or_mixed_blocks: false,
      doubt_on_seminanonimitzable: false,
      conflicting_readings: false,
      exercises: [{ exercise_id: 'a', kind: 'd' }],
      proposed_limitations: lim,
    }

    const out = normalizeTemplateDraft(structuredClone(raw)) as Record<string, unknown>

    expect(out.proposed_limitations).toEqual(lim)
  })

  it('no muta l’objecte d’entrada', () => {
    const raw: Record<string, unknown> = {
      layout_stable: true,
      exercises: [{ exercise_id: 'a', kind: 'd' }],
    }
    const snapshot = structuredClone(raw)
    normalizeTemplateDraft(raw)
    expect(raw).toEqual(snapshot)
  })

  it('retorna input sense canvis si no és objecte pla', () => {
    expect(normalizeTemplateDraft(null)).toBe(null)
    expect(normalizeTemplateDraft('x')).toBe('x')
    expect(normalizeTemplateDraft(1)).toBe(1)
    expect(normalizeTemplateDraft([1, 2])).toEqual([1, 2])
  })
})
