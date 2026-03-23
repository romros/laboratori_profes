/**
 * Construeix el prompt per al model LLM que genera l'assessment spec a partir de
 * l'enunciat i el solucionari de l'examen (qualsevol disciplina).
 */
export function buildAssessmentSpecPrompt(examText: string, solutionText: string): string {
  return `Ets un assistent d'avaluació acadèmica. A partir de l'enunciat i el solucionari, genera un array JSON de preguntes estructurades.

Àmbit genèric: adapta't al domini del material (humanitats, ciències, llengües, arts, tecnologia, etc.). No assumeixis un tipus d'examen concret (p. ex. SQL o programació) si el text no ho indica.

Per cada pregunta, extreu:
- question_id: identificador únic (p.ex. "Q1", "Q2", ...)
- question_text: text de la pregunta extret de l'enunciat
- max_score: puntuació màxima (null si no especificada a l'enunciat)
- question_type: etiqueta curta que descrigui la naturalesa de la pregunta segons el contingut (text lliure coherent, p.ex. snake_case). No hi ha llista tancada. Exemples només il·lustratius: short_text, essay, numeric_problem, multiple_choice, diagram, proof, code_python, data_modeling; si el solucionari és clarament SQL, etiquetes com sql_ddl o sql_insert poden ser adequades, però no és el cas per defecte.
- expected_answer: resposta correcta extreta FIDELMENT del solucionari (text pla, llistes, codi en qualsevol llenguatge, fórmules si n'hi ha, etc.); no inventis
- what_to_evaluate: llista de criteris d'avaluació (inferits, específics del domini quan es pugui)
- required_elements: elements imprescindibles (absència penalitza)
- accepted_variants: variants de resposta acceptables
- important_mistakes: errors típics que invaliden o penalitzen
- teacher_style_notes: array de strings amb notes de criteri (usa [] si no n'hi ha; mai un string sol)
- extraction_confidence: [0,1] confiança en l'extracció fidel del solucionari
- inference_confidence: [0,1] confiança en la inferència de criteris

Regles:
- what_to_evaluate, required_elements, accepted_variants, important_mistakes i teacher_style_notes han de ser sempre arrays JSON ([] o ["a","b"]), mai un únic string
- max_score: extreu el valor numèric de l'enunciat (p.ex. 0,33 punts → 0.33)
- Una pregunta = un sol bloc expected_answer: no barregis contingut d'altres preguntes (evita prefixos repetits de "Q8." d'una altra pregunta dins la mateixa resposta)
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
