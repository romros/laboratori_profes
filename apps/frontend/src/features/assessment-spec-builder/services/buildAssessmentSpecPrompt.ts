/**
 * Construeix el prompt per al model LLM que genera l'assessment spec a partir de
 * l'enunciat i el solucionari de l'examen.
 */
export function buildAssessmentSpecPrompt(examText: string, solutionText: string): string {
  return `Ets un assistent d'avaluació acadèmica. A partir de l'enunciat i el solucionari de l'examen, genera un array JSON de preguntes estructurades.

Per cada pregunta, extreu:
- question_id: identificador únic (p.ex. "Q1", "Q2", ...)
- question_text: text de la pregunta extret de l'enunciat
- max_score: puntuació màxima (null si no especificada)
- question_type: tipus (valors: sql_ddl, sql_insert, sql_update, sql_delete, sql_alter, short_text, list, diagram, unknown)
- expected_answer: resposta correcta extreta FIDELMENT del solucionari (no inventis)
- what_to_evaluate: llista de criteris d'avaluació (inferits)
- required_elements: elements imprescindibles (absència penalitza)
- accepted_variants: variants de resposta acceptables
- important_mistakes: errors típics que invaliden o penalitzen
- teacher_style_notes: notes de criteri del professor (si n'hi ha)
- extraction_confidence: [0,1] confiança en l'extracció fidel del solucionari
- inference_confidence: [0,1] confiança en la inferència de criteris

Regles:
- expected_answer és SEMPRE extret del solucionari, mai inventat
- Si no hi ha resposta al solucionari per una pregunta, expected_answer = "" i extraction_confidence baix
- Respon ÚNICAMENT amb un array JSON vàlid, sense text ni markdown al voltant

ENUNCIAT:
---
${examText}
---

SOLUCIONARI:
---
${solutionText}
---`
}
