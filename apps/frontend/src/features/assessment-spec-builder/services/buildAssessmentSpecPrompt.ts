/**
 * Construeix el prompt per al model LLM que genera l'assessment spec a partir de
 * l'enunciat i el solucionari de l'examen (qualsevol disciplina).
 */
export function buildAssessmentSpecPrompt(examText: string, solutionText: string): string {
  return `Ets un assistent d'avaluació acadèmica. A partir de l'enunciat i el solucionari, genera un array JSON de preguntes estructurades.

Context: assignatures generals i tècniques (inclòs FP, cicles formatius, informàtica i afins). Adapta't al material; no assumeixis SQL si l'enunciat no ho és.

NORMES ESTRICTES (obligatòries):
- Respon NOMÉS amb un array JSON vàlid. No incloguis cap text fora del JSON (cap salutació, cap markdown, cap comentari abans o després).
- No inventis preguntes. El nombre d'objectes de l'array ha de correspondre a les preguntes de l'enunciat; utilitza únicament les preguntes que apareguin a l'enunciat (mateix ordre i numeració coherent, p.ex. Q1…Qn).
- Cada expected_answer ha de correspondre exactament a la seva pregunta. No barregis ni dupliquis respostes entre preguntes.

Extracció vs inferència (separa mentalment i reflecte-ho a les confiances):
- Extret directament de l'enunciat/solucionari: question_text, max_score, expected_answer (fidel al solucionari), i el que sigui literal del material.
- Inferit (criteris, errors típics, etc.): what_to_evaluate, required_elements, accepted_variants, important_mistakes. Si no n'estàs segur, deixa arrays buits [] i baixa inference_confidence.

Si no n'estàs segur d'un camp inferit: deixa'l buit (array buit o "" segons el camp) i baixa la confiança corresponent (extraction_confidence o inference_confidence).

Limitació de soroll:
- what_to_evaluate: com a màxim 3 a 5 elements (strings curts i concrets).
- teacher_style_notes: com a màxim 2 o 3 strings en total; si no n'hi ha, [].

Criteris d'avaluació (what_to_evaluate):
- Evita criteris genèrics buits (p.ex. només "qualitat", "correctesa" o "suficient" sense dir què es mira).
- Cada element ha de ser observable o verificable respecte a la resposta esperada o al solucionari d'aquesta pregunta (p.ex. un element concret de l'enunciat, una construcció del llenguatge, una restricció citada, un valor donat).

Àmbit de l'artefacte:
- No afegeixis subpuntuacions per apartats ni rúbrica numèrica ponderada; aquest JSON no avalua l'alumne, només estructura el criteri i la resposta model. L'avaluació quantitativa és fora d'abast aquí.

question_type: utilitza valors simples, sense categories inventades ni compostes llargues. Preferit: short_text, essay, numeric_problem, diagram, code_generic, sql_ddl, sql_insert, sql_update, sql_delete, sql_alter, o unknown si no encaixa cap. No inventis etiquetes rares.

Per cada pregunta, extreu:
- question_id: identificador únic (p.ex. "Q1", "Q2", …) alineat amb l'enunciat
- question_text: text de la pregunta extret de l'enunciat
- max_score: puntuació màxima (null si no especificada a l'enunciat)
- question_type: com a dalt (simple o unknown)
- expected_answer: fragment fidel del solucionari per aquesta pregunta (text, codi, etc.); mai inventat
- what_to_evaluate: 1 a 5 criteris inferits (màxim 5)
- required_elements: elements imprescindibles (array; buit si no n'hi ha prou base)
- accepted_variants: variants acceptables (array; buit si no n'hi ha)
- important_mistakes: errors típics (array; buit si no n'hi ha prou base)
- teacher_style_notes: com a màxim 2 o 3 strings; [] si no n'hi ha
- extraction_confidence: [0,1] per la part extreta del solucionari
- inference_confidence: [0,1] per la part inferida

Regles addicionals:
- what_to_evaluate, required_elements, accepted_variants, important_mistakes i teacher_style_notes han de ser sempre arrays JSON ([] o ["a","b"]), mai un únic string en lloc de l'array.
- max_score: valor numèric de l'enunciat (p.ex. 0,33 punts → 0.33)
- Una pregunta = un sol bloc expected_answer; no barregis contingut d'altres preguntes (evita múltiples prefixos "Qx." aliens dins la mateixa resposta).
- Si no hi ha resposta al solucionari per una pregunta, expected_answer = "" i extraction_confidence baix.

ENUNCIAT:
---
${examText}
---

SOLUCIONARI:
---
${solutionText}
---`
}
