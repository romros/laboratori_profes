import type { ExamFeasibilityDraft } from '../../src/domain/template-inference/exam_feasibility.schema'

/** §8.5 sis d, vuit n → #d no > #n */
export const noGoMajorityNExam: ExamFeasibilityDraft = {
  layout_stable: true,
  identity_mixed_with_answer: false,
  identity_reused_as_gradable_content: false,
  single_n_concentrates_majority_grade: false,
  free_text_without_box_main_form: false,
  layout_differs_per_student: false,
  answers_in_undelimited_margins_or_mixed_blocks: false,
  doubt_on_seminanonimitzable: false,
  conflicting_readings: false,
  exercises: [
    { exercise_id: 'd1', kind: 'd' },
    { exercise_id: 'd2', kind: 'd' },
    { exercise_id: 'd3', kind: 'd' },
    { exercise_id: 'd4', kind: 'd' },
    { exercise_id: 'd5', kind: 'd' },
    { exercise_id: 'd6', kind: 'd' },
    { exercise_id: 'n1', kind: 'n' },
    { exercise_id: 'n2', kind: 'n' },
    { exercise_id: 'n3', kind: 'n' },
    { exercise_id: 'n4', kind: 'n' },
    { exercise_id: 'n5', kind: 'n' },
    { exercise_id: 'n6', kind: 'n' },
    { exercise_id: 'n7', kind: 'n' },
    { exercise_id: 'n8', kind: 'n' },
  ],
}
