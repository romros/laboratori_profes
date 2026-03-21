import type { TemplateFeasibilityDraft } from '../../src/domain/template-inference/template_feasibility.schema'

/** Mateixa pregunta dues vegades a la mateixa pàgina → `ko` estructural. */
export const templateKoDuplicateQuestionDraft: TemplateFeasibilityDraft = {
  layout_stable: true,
  answer_regions: [
    { question_id: '1', page: 1, bbox: { x: 0.1, y: 0.2, w: 0.3, h: 0.08 } },
    { question_id: '1', page: 1, bbox: { x: 0.5, y: 0.2, w: 0.3, h: 0.08 } },
  ],
}
