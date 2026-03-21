import { z } from 'zod'

/** Coordenades normalitzades 0..1 (pàgina de plantilla). */
export const normalizedUnitSchema = z.number().min(0).max(1)

/**
 * Caixa normalitzada (0..1) per a una regió de resposta sobre la plantilla.
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
