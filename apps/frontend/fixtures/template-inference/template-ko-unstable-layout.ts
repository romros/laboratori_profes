import type { TemplateFeasibilityDraft } from '../../src/domain/template-inference/template_feasibility.schema'

/** Layout inestable malgrat tenir una regió proposada → `ko` (fail-closed). */
export const templateKoUnstableLayoutDraft: TemplateFeasibilityDraft = {
  layout_stable: false,
  answer_regions: [{ question_id: '1', page: 1, bbox: { x: 0.1, y: 0.2, w: 0.75, h: 0.08 } }],
}
