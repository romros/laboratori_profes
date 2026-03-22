import { z } from 'zod'

/**
 * Contracte mínim estable: extracció de text de resposta per pregunta (examen alumne, OCR).
 *
 * **Semàntica de `status` (honesta, implementable):**
 * - **`ok`:** hi ha text no trivial (prou llarg i amb prou lletres) i no s’ha aplicat tall intern
 *   que en faci dubtar la completitud; el bloc és usable com a base per revisió humana.
 * - **`empty`:** bloc buit o gairebé buit (sense prou caràcters útils); no s’espera contingut de resposta.
 * - **`uncertain`:** bloc sospitós (poca densitat de lletres), **o** segmentació global dubtosa
 *   (`_unsegmented`), **o** el pipeline ha **tallat** el fragment (heurística de mida) i el text
 *   pot estar incomplet, **o** barreja OCR que no permet afirmar `ok` amb confiança.
 *
 * No és taxonomia completa de qualitat OCR; només el mínim perquè la capa superior no confongui
 * precisió amb cobertura.
 */
export const questionAnswerItemStatusSchema = z.enum(['ok', 'empty', 'uncertain'])

export type QuestionAnswerItemStatus = z.infer<typeof questionAnswerItemStatusSchema>

export const questionAnswerExtractionItemSchema = z.object({
  question_id: z.string().min(1),
  /** Text de resposta estable; sense artefactes de diagnòstic ni marcadors interns del pipeline. */
  answer_text: z.string(),
  status: questionAnswerItemStatusSchema,
  page_indices: z.array(z.number().int().positive()),
})

export type QuestionAnswerExtractionItem = z.infer<typeof questionAnswerExtractionItemSchema>

/** Sortida estable de producte (consumidor superior: API futura, UI, etc.). */
export const questionAnswerExtractionResultSchema = z.object({
  items: z.array(questionAnswerExtractionItemSchema),
})

export type QuestionAnswerExtractionResult = z.infer<typeof questionAnswerExtractionResultSchema>

/**
 * Metadades tècniques de diagnòstic; **no** formen part del contracte estable de producte
 * (`QuestionAnswerExtractionResult`).
 */
export const questionAnswerExtractionDiagnosticSchema = z.object({
  page_count: z.number().int().nonnegative(),
  raster_target_width: z.number().int().positive(),
  ocr_languages: z.string(),
  detection_note: z.string().optional(),
  marker_count_before_dedupe: z.number().int().nonnegative().optional(),
  marker_count_after_dedupe: z.number().int().nonnegative().optional(),
  /** Un element per entrada afectada p.ex. per tall de segment. */
  truncation_notes: z.array(z.string()).optional(),
})

export type QuestionAnswerExtractionDiagnostic = z.infer<
  typeof questionAnswerExtractionDiagnosticSchema
>
