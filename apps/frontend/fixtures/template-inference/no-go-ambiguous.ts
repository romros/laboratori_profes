import type { ExamFeasibilityDraft } from '../../src/domain/template-inference/exam_feasibility.schema'

import { goBasicExam } from './go-basic'

/** §6 dubte / conflicte → fail-closed */
export const noGoAmbiguousExam: ExamFeasibilityDraft = {
  ...goBasicExam,
  doubt_on_seminanonimitzable: true,
  conflicting_readings: true,
}
