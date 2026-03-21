import {
  type ExamFeasibilityDraft,
  examFeasibilityDraftSchema,
  type FeasibilityDecision,
} from '../../../domain/template-inference/exam_feasibility.schema'
import { FEASIBILITY_MAX_LIMITATIONS } from '../../../domain/template-inference/constants'
import { templateDraftSchema } from '../../../domain/template-inference/template.schema'

export type SchemaIssue = { path: string; message: string }

export type ValidateTemplateDraftSuccess = {
  ok: true
  decision: Exclude<FeasibilityDecision, 'no_apte'>
  reasons: string[]
}

export type ValidateTemplateDraftFailure = {
  ok: false
  decision: 'no_apte'
  reasons: string[]
  schemaErrors?: SchemaIssue[]
}

export type ValidateTemplateDraftResult =
  | ValidateTemplateDraftSuccess
  | ValidateTemplateDraftFailure

export type ValidateTemplateDraftInput = {
  exam: unknown
  template: unknown
}

function flattenZodIssues(err: {
  issues: { path: (string | number)[]; message: string }[]
}): SchemaIssue[] {
  return err.issues.map((i) => ({
    path: i.path.length ? i.path.join('.') : '(root)',
    message: i.message,
  }))
}

/** §5 — validació mecànica de limitacions (refs mínimes per tipus). */
function limitationsSatisfySection5(
  lims: NonNullable<ExamFeasibilityDraft['proposed_limitations']>,
):
  | {
      ok: true
    }
  | { ok: false; reasons: string[] } {
  if (lims.length === 0) {
    return { ok: false, reasons: ['§5 proposed_limitations buit'] }
  }
  if (lims.length > FEASIBILITY_MAX_LIMITATIONS) {
    return { ok: false, reasons: [`§5 més de ${FEASIBILITY_MAX_LIMITATIONS} limitacions`] }
  }
  const reasons: string[] = []
  for (let i = 0; i < lims.length; i++) {
    const L = lims[i]
    const p = `proposed_limitations[${i}]`
    if (!L.sentence.trim()) {
      reasons.push(`${p}: §5.1 frase buida`)
      continue
    }
    const lower = L.sentence.toLowerCase()
    if (
      lower.includes('tot el document') ||
      lower.includes('tot el full') ||
      lower.includes('interpretar tot') ||
      lower.includes('decidir límits') ||
      lower.includes('decidir limits')
    ) {
      reasons.push(`${p}: §5.3 limitació massa oberta (interpretació global)`)
    }
    if (L.type === 'human_review_delimited_box' && !L.item_id?.trim()) {
      reasons.push(`${p}: §5.2 cal item_id per revisió humana d’ítem delimitat`)
    }
    if (L.type === 'exclude_numbered_page_section' && !L.page_or_section_ref?.trim()) {
      reasons.push(`${p}: §5.2 cal page_or_section_ref per exclusió numerada`)
    }
    if (L.type === 'disable_automated_item' && !L.item_id?.trim()) {
      reasons.push(`${p}: §5.2 cal item_id per desactivació d’ítem`)
    }
  }
  return reasons.length ? { ok: false, reasons } : { ok: true }
}

function countDn(exercises: ExamFeasibilityDraft['exercises']): { nd: number; nn: number } {
  let nd = 0
  let nn = 0
  for (const e of exercises) {
    if (e.kind === 'd') nd++
    else nn++
  }
  return { nd, nn }
}

function weightDominanceN(exercises: ExamFeasibilityDraft['exercises']): boolean | null {
  const allKnown = exercises.every((e) => e.weight_known === true && e.weight !== undefined)
  if (!allKnown) return null
  let sumD = 0
  let sumN = 0
  for (const e of exercises) {
    const w = e.weight ?? 0
    if (e.kind === 'd') sumD += w
    else sumN += w
  }
  return sumN >= sumD
}

/**
 * Validator pur: ordre §7 de feasibility-definition.md.
 * Fail-closed: dubte/conflicte → no_apte.
 */
export function validateTemplateDraft(
  input: ValidateTemplateDraftInput,
): ValidateTemplateDraftResult {
  const examParsed = examFeasibilityDraftSchema.safeParse(input.exam)
  if (!examParsed.success) {
    return {
      ok: false,
      decision: 'no_apte',
      reasons: ['Schema exam feasibility invàlid'],
      schemaErrors: flattenZodIssues(examParsed.error),
    }
  }

  const tplParsed = templateDraftSchema.safeParse(input.template)
  if (!tplParsed.success) {
    return {
      ok: false,
      decision: 'no_apte',
      reasons: ['Schema template draft invàlid'],
      schemaErrors: flattenZodIssues(tplParsed.error),
    }
  }

  const exam = examParsed.data
  const reasons: string[] = []

  // §7.1 — no_apte (§4, §6, §3 cas mixt / crític, §1)
  if (exam.identity_mixed_with_answer) {
    reasons.push('§4 identitat barrejada amb resposta avaluable')
  }
  if (exam.identity_reused_as_gradable_content) {
    reasons.push(
      '§4 identitat com a part del contingut avaluable (p. ex. signatura dins àrea de nota)',
    )
  }
  if (exam.free_text_without_box_main_form) {
    reasons.push('§6 text lliure sense caixa com a forma principal')
  }
  if (exam.layout_differs_per_student) {
    reasons.push('§6 layout diferent per alumne')
  }
  if (exam.answers_in_undelimited_margins_or_mixed_blocks) {
    reasons.push('§6 marges no delimitats o barreja enunciat/resposta')
  }
  if (exam.doubt_on_seminanonimitzable) {
    reasons.push('§6 dubte raonable sobre seminanonimitzable')
  }
  if (exam.conflicting_readings) {
    reasons.push('§6 conflicte / lectures incompatibles')
  }
  if (!exam.layout_stable) {
    reasons.push('§1 layout no estable (no seminanonimitzable estricte)')
  }

  const { nd, nn } = countDn(exam.exercises)
  if (nd <= nn) {
    reasons.push(`§3 #d (${nd}) ha de ser estrictament major que #n (${nn})`)
  }

  const wDom = weightDominanceN(exam.exercises)
  if (wDom === true) {
    reasons.push('§3.2 suma de pesos n ≥ suma de pesos d (totes les peses conegudes)')
  }

  if (exam.single_n_concentrates_majority_grade) {
    reasons.push('§3 ítem n crític / concentra major part de la nota')
  }

  if (reasons.length > 0) {
    return { ok: false, decision: 'no_apte', reasons }
  }

  // §7.2 — apte
  const lims = exam.proposed_limitations ?? []
  const baseApte =
    exam.layout_stable &&
    nd > nn &&
    wDom !== true &&
    !exam.single_n_concentrates_majority_grade &&
    lims.length === 0

  if (baseApte) {
    return {
      ok: true,
      decision: 'apte',
      reasons: ['§7.2 satisfet: apte sense limitacions explícites'],
    }
  }

  // §7.3 — apte_amb_limitacions (només si no hem caigut en no_apte al pas 1)
  if (lims.length > 0) {
    const limCheck = limitationsSatisfySection5(lims)
    if (limCheck.ok) {
      const stillOk =
        exam.layout_stable && nd > nn && wDom !== true && !exam.single_n_concentrates_majority_grade
      if (stillOk) {
        return {
          ok: true,
          decision: 'apte_amb_limitacions',
          reasons: ['§7.3 satisfet amb limitacions §5'],
        }
      }
      return {
        ok: false,
        decision: 'no_apte',
        reasons: [
          '§7.3 limitacions present però condicions base (§1/§3) no satisfetes simultàniament (fail-closed)',
        ],
      }
    }
    return { ok: false, decision: 'no_apte', reasons: limCheck.reasons }
  }

  return {
    ok: false,
    decision: 'no_apte',
    reasons: ['§7 no encaixa en apte ni en apte_amb_limitacions vàlid (fail-closed)'],
  }
}
