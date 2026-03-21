import { z } from 'zod'

import { regionSchema } from './template.schema'

/**
 * Regió de resposta delimitable sobre la plantilla del professor (coordenades normalitzades 0..1).
 * No classifica contingut de l’alumne; només geometria per crops futurs.
 */
export const answerRegionSchema = z.object({
  question_id: z.string().min(1),
  page: z.number().int().positive(),
  bbox: regionSchema,
})

export type AnswerRegion = z.infer<typeof answerRegionSchema>

/**
 * Esborrany que pot venir del model o del stub (abans del validator de producte).
 */
export const templateFeasibilityDraftSchema = z.object({
  answer_regions: z.array(answerRegionSchema).default([]),
  /** Si false, el layout no permet delimitar crops amb confiança. */
  layout_stable: z.boolean().optional(),
  /**
   * Si true, enunciat i resposta apareixen massa barrejats per proposar regions fiables.
   */
  prompt_answer_regions_not_separable: z.boolean().optional(),
})

export type TemplateFeasibilityDraft = z.infer<typeof templateFeasibilityDraftSchema>

/** Sortida de producte Feature 0 (plantilla → viabilitat d’extracció de regions). */
export type TemplateFeasibilityResult =
  | { status: 'ok'; answer_regions: AnswerRegion[] }
  | { status: 'ko'; reasons: string[] }
