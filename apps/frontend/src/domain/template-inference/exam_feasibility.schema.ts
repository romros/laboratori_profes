import { z } from 'zod'

import { FEASIBILITY_MAX_LIMITATIONS, LIMITATION_TYPES } from './constants'

/** §2 — categories de resultat (runtime contract) */
export const feasibilityDecisionSchema = z.enum(['apte', 'apte_amb_limitacions', 'no_apte'])

export type FeasibilityDecision = z.infer<typeof feasibilityDecisionSchema>

/** Valida només el literal de decisió (enum). */
export function parseFeasibilityDecision(value: unknown) {
  return feasibilityDecisionSchema.safeParse(value)
}

/** §3 — classificació d’ítem avaluable */
export const exerciseItemKindSchema = z.enum(['d', 'n'])

export type ExerciseItemKind = z.infer<typeof exerciseItemKindSchema>

export const exerciseFeasibilityItemSchema = z
  .object({
    exercise_id: z.string().min(1),
    kind: exerciseItemKindSchema,
    /** Si true i `weight` present, compta per suma de pesos §3.2 */
    weight_known: z.boolean().optional(),
    weight: z.number().nonnegative().optional(),
  })
  .superRefine((row, ctx) => {
    if (row.weight_known === true && row.weight === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'weight required when weight_known is true',
        path: ['weight'],
      })
    }
    if (row.weight !== undefined && row.weight_known === false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'weight must not be set when weight_known is false',
        path: ['weight'],
      })
    }
  })

export type ExerciseFeasibilityItem = z.infer<typeof exerciseFeasibilityItemSchema>

export const limitationDraftSchema = z.object({
  type: z.enum(LIMITATION_TYPES),
  /** Una frase concreta (accionable) §5.1 */
  sentence: z.string().min(1).max(500),
  /** Referència opcional ítem delimitat (revisió / desactivació) */
  item_id: z.string().optional(),
  /** Referència pàgina o secció numerada (exclusió) */
  page_or_section_ref: z.string().optional(),
})

export type LimitationDraft = z.infer<typeof limitationDraftSchema>

/**
 * Draft d’examen per avaluar feasibility (sense LLM ni PDF).
 * Els booleans reflecteixen fets ja etiquetats; el validator és mecànic respecte feasibility-definition.md.
 */
export const examFeasibilityDraftSchema = z.object({
  /** §1 layout estable */
  layout_stable: z.boolean(),
  /** §4 — identitat barrejada amb resposta avaluable */
  identity_mixed_with_answer: z.boolean(),
  /** §4 — identitat reutilitzada com a contingut a corregir (p. ex. signatura dins àrea de nota) */
  identity_reused_as_gradable_content: z.boolean(),
  /** §3 — únic nucli n concentra major part de nota / crític */
  single_n_concentrates_majority_grade: z.boolean(),
  /** §6 — triggers addicionals */
  free_text_without_box_main_form: z.boolean(),
  layout_differs_per_student: z.boolean(),
  answers_in_undelimited_margins_or_mixed_blocks: z.boolean(),
  /** Dubte raonable §1–§3 → fail-closed §6 */
  doubt_on_seminanonimitzable: z.boolean(),
  /** Lectures incompatibles §6 */
  conflicting_readings: z.boolean(),
  exercises: z.array(exerciseFeasibilityItemSchema).min(1),
  /** §5 — propostes (buit = sense limitacions explícites al draft) */
  proposed_limitations: z.array(limitationDraftSchema).max(FEASIBILITY_MAX_LIMITATIONS).optional(),
})

export type ExamFeasibilityDraft = z.infer<typeof examFeasibilityDraftSchema>

/** Alias de producte: mateix que `ExamFeasibilityDraft`. */
export type ExamFeasibility = ExamFeasibilityDraft
