import { describe, expect, it } from 'vitest'

import { templateClearViableDraft } from '../../../fixtures/template-inference/template-clear-viable'
import { templateKoDuplicateQuestionDraft } from '../../../fixtures/template-inference/template-ko-duplicate-question'
import { templateKoMixedPromptDraft } from '../../../fixtures/template-inference/template-ko-mixed-prompt'
import { templateKoUnstableLayoutDraft } from '../../../fixtures/template-inference/template-ko-unstable-layout'
import { validateTemplateFeasibility } from '../../../src/features/template-inference/services/validateTemplateFeasibility'

describe('validateTemplateFeasibility', () => {
  it('accepta plantilla viable amb answer_regions coherents', () => {
    const r = validateTemplateFeasibility(templateClearViableDraft)
    expect(r.status).toBe('ok')
    if (r.status === 'ok') {
      expect(r.answer_regions).toHaveLength(2)
      expect(r.answer_regions[0].question_id).toBe('1')
      expect(r.answer_regions[0].page).toBe(1)
      expect(r.answer_regions[0].bbox).toMatchObject({ x: expect.any(Number) })
    }
  })

  it('rebutja plantilla sense regions', () => {
    const r = validateTemplateFeasibility({ answer_regions: [], layout_stable: true })
    expect(r.status).toBe('ko')
    if (r.status === 'ko') {
      expect(r.reasons.some((x) => x.includes('No s’han detectat'))).toBe(true)
    }
  })

  it('rebutja enunciat/resposta massa barrejats', () => {
    const r = validateTemplateFeasibility(templateKoMixedPromptDraft)
    expect(r.status).toBe('ko')
    if (r.status === 'ko') {
      expect(r.reasons.some((x) => x.includes('barrejats'))).toBe(true)
    }
  })

  it('rebutja layout inestable', () => {
    const r = validateTemplateFeasibility(templateKoUnstableLayoutDraft)
    expect(r.status).toBe('ko')
    if (r.status === 'ko') {
      expect(r.reasons.some((x) => x.includes('Layout de la plantilla'))).toBe(true)
    }
  })

  it('rebutja duplicats mateixa pregunta i pàgina', () => {
    const r = validateTemplateFeasibility(templateKoDuplicateQuestionDraft)
    expect(r.status).toBe('ko')
    if (r.status === 'ko') {
      expect(r.reasons.some((x) => x.includes('duplicats'))).toBe(true)
    }
  })

  it('esquema invàlid → ko amb motiu comprensible (no només path Zod)', () => {
    const r = validateTemplateFeasibility({
      answer_regions: [{ question_id: '', page: 1, bbox: { x: 0, y: 0, w: 0.5, h: 0.5 } }],
    })
    expect(r.status).toBe('ko')
    if (r.status === 'ko') {
      expect(r.reasons[0]).toContain('format esperat')
    }
  })
})
