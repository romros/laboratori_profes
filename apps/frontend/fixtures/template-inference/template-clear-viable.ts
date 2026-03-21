import type { TemplateFeasibilityDraft } from '../../src/domain/template-inference/template_feasibility.schema'

/** Plantilla clara: dues preguntes amb regions delimitables → `status: ok` després del validator. */
export const templateClearViableDraft: TemplateFeasibilityDraft = {
  layout_stable: true,
  answer_regions: [
    { question_id: '1', page: 1, bbox: { x: 0.08, y: 0.22, w: 0.84, h: 0.09 } },
    { question_id: '2', page: 1, bbox: { x: 0.08, y: 0.38, w: 0.84, h: 0.1 } },
  ],
}
