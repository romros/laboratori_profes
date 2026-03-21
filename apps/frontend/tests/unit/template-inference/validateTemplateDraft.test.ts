import { describe, expect, it } from 'vitest'

import { goBasicExam } from '../../../fixtures/template-inference/go-basic'
import { goWithLimitationsExam } from '../../../fixtures/template-inference/go-with-limitations'
import { minimalValidTemplate } from '../../../fixtures/template-inference/minimal-template'
import { noGoAmbiguousExam } from '../../../fixtures/template-inference/no-go-ambiguous'
import { noGoIdentityMixedExam } from '../../../fixtures/template-inference/no-go-identity-mixed'
import { noGoMajorityNExam } from '../../../fixtures/template-inference/no-go-majority-n'
import type { ExamFeasibilityDraft } from '../../../src/domain/template-inference/exam_feasibility.schema'
import { validateTemplateDraft } from '../../../src/features/template-inference/services/validateTemplateDraft'

function tpl() {
  return structuredClone(minimalValidTemplate)
}

describe('validateTemplateDraft', () => {
  it('retorna apte per majoria d clara (fixture go-basic)', () => {
    const r = validateTemplateDraft({ exam: goBasicExam, template: tpl() })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.decision).toBe('apte')
  })

  it('retorna apte_amb_limitacions només amb limitacions §5 vàlides', () => {
    const r = validateTemplateDraft({ exam: goWithLimitationsExam, template: tpl() })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.decision).toBe('apte_amb_limitacions')
  })

  it('retorna no_apte quan identitat barrejada amb resposta (§4)', () => {
    const r = validateTemplateDraft({ exam: noGoIdentityMixedExam, template: tpl() })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.decision).toBe('no_apte')
      expect(r.reasons.some((x) => x.includes('§4'))).toBe(true)
    }
  })

  it('retorna no_apte quan identitat és contingut avaluable (§4 signatura / àrea nota)', () => {
    const exam: ExamFeasibilityDraft = {
      ...goBasicExam,
      identity_reused_as_gradable_content: true,
    }
    const r = validateTemplateDraft({ exam, template: tpl() })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reasons.some((x) => x.includes('§4'))).toBe(true)
    }
  })

  it('retorna no_apte quan ítem n crític / concentra nota (§3)', () => {
    const exam: ExamFeasibilityDraft = {
      ...goBasicExam,
      single_n_concentrates_majority_grade: true,
    }
    const r = validateTemplateDraft({ exam, template: tpl() })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reasons.some((x) => x.includes('§3'))).toBe(true)
    }
  })

  it('retorna no_apte quan #n domina #d', () => {
    const r = validateTemplateDraft({ exam: noGoMajorityNExam, template: tpl() })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reasons.some((x) => x.includes('§3'))).toBe(true)
    }
  })

  it('retorna no_apte amb dubte o conflicte (fail-closed §6)', () => {
    const r = validateTemplateDraft({ exam: noGoAmbiguousExam, template: tpl() })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reasons.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('retorna no_apte amb limitació massa oberta (§5.3)', () => {
    const exam: ExamFeasibilityDraft = {
      ...goBasicExam,
      proposed_limitations: [
        {
          type: 'exclude_numbered_page_section',
          sentence: 'Cal interpretar tot el full manualment.',
          page_or_section_ref: '1',
        },
      ],
    }
    const r = validateTemplateDraft({ exam, template: tpl() })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reasons.some((x) => x.includes('§5.3') || x.includes('§5'))).toBe(true)
    }
  })

  it('retorna no_apte quan limitació human_review sense item_id (§5.2)', () => {
    const exam: ExamFeasibilityDraft = {
      ...goBasicExam,
      proposed_limitations: [
        {
          type: 'human_review_delimited_box',
          sentence: 'Revisió humana obligatòria del requadre final.',
        },
      ],
    }
    const r = validateTemplateDraft({ exam, template: tpl() })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reasons.some((x) => x.includes('§5.2') || x.includes('item_id'))).toBe(true)
    }
  })

  it('retorna no_apte quan suma pesos n ≥ d (§3.2)', () => {
    const exam: ExamFeasibilityDraft = {
      ...goBasicExam,
      exercises: [
        { exercise_id: 'd1', kind: 'd', weight_known: true, weight: 1 },
        { exercise_id: 'n1', kind: 'n', weight_known: true, weight: 2 },
      ],
    }
    const r = validateTemplateDraft({ exam, template: tpl() })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reasons.some((x) => x.includes('§3.2'))).toBe(true)
    }
  })

  it('retorna schemaErrors si template duplica exercise_id', () => {
    const badTpl = {
      regions: [
        { exercise_id: 'x', bbox: { x: 0, y: 0, w: 0.1, h: 0.1 } },
        { exercise_id: 'x', bbox: { x: 0.2, y: 0, w: 0.1, h: 0.1 } },
      ],
    }
    const r = validateTemplateDraft({ exam: goBasicExam, template: badTpl })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.schemaErrors?.length).toBeGreaterThan(0)
  })
})
