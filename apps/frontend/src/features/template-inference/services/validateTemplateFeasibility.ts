import {
  type AnswerRegion,
  type TemplateFeasibilityResult,
  templateFeasibilityDraftSchema,
} from '../../../domain/template-inference/template_feasibility.schema'

/** Resultat del pipeline d’anàlisi (debug + decisió de producte). */
export type TemplateFeasibilityPipelineResult = {
  rawDraft: unknown
  normalizedDraft: unknown
  result: TemplateFeasibilityResult
}

export type SchemaIssue = { path: string; message: string }

function flattenZodIssues(err: {
  issues: { path: (string | number)[]; message: string }[]
}): SchemaIssue[] {
  return err.issues.map((i) => ({
    path: i.path.length ? i.path.join('.') : '(root)',
    message: i.message,
  }))
}

function koFromSchema(schemaErrors: SchemaIssue[]): TemplateFeasibilityResult {
  const detail = schemaErrors
    .slice(0, 3)
    .map((e) => `${e.path}: ${e.message}`)
    .join('; ')
  return {
    status: 'ko',
    reasons: [
      detail
        ? `El borrador no té el format esperat per a regions de resposta (${detail}).`
        : 'El borrador no té el format esperat per a regions de resposta.',
    ],
  }
}

function duplicateQuestionKeys(regions: AnswerRegion[]): string[] {
  const seen = new Set<string>()
  const dups: string[] = []
  for (const r of regions) {
    const k = `${r.page}:${r.question_id}`
    if (seen.has(k)) {
      dups.push(k)
    }
    seen.add(k)
  }
  return dups
}

/**
 * Validator pur: plantilla viable per delimitar `answer_regions` o `ko` amb motius de layout/estructura.
 * Fail-closed.
 */
export function validateTemplateFeasibility(normalizedDraft: unknown): TemplateFeasibilityResult {
  const parsed = templateFeasibilityDraftSchema.safeParse(normalizedDraft)
  if (!parsed.success) {
    return koFromSchema(flattenZodIssues(parsed.error))
  }

  const draft = parsed.data

  if (draft.layout_stable === false) {
    return {
      status: 'ko',
      reasons: [
        'Layout de la plantilla no prou estable per delimitar regions de resposta de forma fiable.',
      ],
    }
  }

  if (draft.prompt_answer_regions_not_separable === true) {
    return {
      status: 'ko',
      reasons: [
        'Enunciat i zona de resposta massa barrejats; no es poden proposar regions de crop fiables per pregunta.',
      ],
    }
  }

  if (draft.answer_regions.length === 0) {
    return {
      status: 'ko',
      reasons: ['No s’han detectat regions de resposta delimitables per pregunta.'],
    }
  }

  const dup = duplicateQuestionKeys(draft.answer_regions)
  if (dup.length > 0) {
    return {
      status: 'ko',
      reasons: [
        'Hi ha identificadors de pregunta duplicats en la mateixa pàgina; cal una regió única per pregunta i pàgina.',
      ],
    }
  }

  return { status: 'ok', answer_regions: draft.answer_regions }
}
