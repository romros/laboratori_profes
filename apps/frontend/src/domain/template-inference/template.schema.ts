import { z } from 'zod'

/** Coordenades normalitzades 0..1 (plantilla). */
export const normalizedUnitSchema = z.number().min(0).max(1)

/**
 * Regió geomètrica normalitzada (0..1) — contracte «Region».
 */
export const regionSchema = z
  .object({
    x: normalizedUnitSchema,
    y: normalizedUnitSchema,
    w: normalizedUnitSchema,
    h: normalizedUnitSchema,
  })
  .superRefine((b, ctx) => {
    if (b.x + b.w > 1 + 1e-9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'x + w must not exceed 1',
        path: ['w'],
      })
    }
    if (b.y + b.h > 1 + 1e-9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'y + h must not exceed 1',
        path: ['h'],
      })
    }
  })

export type Region = z.infer<typeof regionSchema>

/** Alias històric; mateix que `regionSchema`. */
export const normalizedBBoxSchema = regionSchema

/**
 * Regió d’exercici a la plantilla (`exercise_id` + caixa) — «ExerciseRegion».
 */
export const exerciseRegionSchema = z.object({
  exercise_id: z.string().min(1),
  bbox: regionSchema,
})

export type ExerciseRegion = z.infer<typeof exerciseRegionSchema>

/** @deprecated Usar `exerciseRegionSchema`. */
export const templateRegionSchema = exerciseRegionSchema

export type TemplateRegion = ExerciseRegion

export const templateDraftSchema = z
  .object({ regions: z.array(exerciseRegionSchema).min(1) })
  .superRefine((data, ctx) => {
    const seen = new Set<string>()
    for (let i = 0; i < data.regions.length; i++) {
      const id = data.regions[i].exercise_id
      if (seen.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate exercise_id: ${id}`,
          path: ['regions', i, 'exercise_id'],
        })
        return
      }
      seen.add(id)
    }
  })

export type TemplateDraft = z.infer<typeof templateDraftSchema>
