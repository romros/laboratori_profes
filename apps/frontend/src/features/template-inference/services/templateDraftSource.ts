/**
 * Font injectable del draft brut (examen) abans de normalitzar/validar.
 * No normalitza ni valida; només lliura `unknown` per al pipeline de l’analyzer.
 */
export type TemplateDraftSource = {
  getDraft(input: { text: string }): unknown | Promise<unknown>
}
