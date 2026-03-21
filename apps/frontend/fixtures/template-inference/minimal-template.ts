import type { TemplateDraft } from '../../src/domain/template-inference/template.schema'

/** Plantilla mínima vàlida per acoplar amb fixtures d’examen (1 regió). */
export const minimalValidTemplate: TemplateDraft = {
  regions: [{ exercise_id: 'q1', bbox: { x: 0, y: 0, w: 0.5, h: 0.5 } }],
}
