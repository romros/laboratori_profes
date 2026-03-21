import type { TemplateFeasibilityDraft } from '../../src/domain/template-inference/template_feasibility.schema'

/** Enunciat i resposta massa barrejats → `ko` amb motiu de layout. */
export const templateKoMixedPromptDraft: TemplateFeasibilityDraft = {
  layout_stable: true,
  prompt_answer_regions_not_separable: true,
  answer_regions: [],
}
