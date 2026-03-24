import type { QuestionSpec } from '../../../domain/assessment-spec/assessmentSpec.schema'

export type BuildEvaluateAnswerPromptParams = {
  questionSpec: QuestionSpec
  answerText: string
  examDocumentContext?: string
}

function blockOrPlaceholder(label: string, content: string | undefined, emptyNote: string): string {
  const body = content != null && content.trim().length > 0 ? content.trim() : emptyNote
  return `## ${label}\n\n${body}\n`
}

function formatList(items: string[]): string {
  if (items.length === 0) return '(cap)'
  return items.map((item) => `- ${item}`).join('\n')
}

export function buildEvaluateAnswerPrompt(params: BuildEvaluateAnswerPromptParams): string {
  const { questionSpec: q, answerText, examDocumentContext } = params

  return `MODE PROFESSOR

Avalua com ho faria el professor que ha creat el solucionari.

Això implica:
- Segueix el mateix criteri d'exigència que marca l'AssessmentSpec.
- Diferencia entre errors crítics (important_mistakes) i errors menors.
- Dona feedback útil per entendre què falta o què està malament.

Pel que fa al to:
- Sigues clar, directe i tècnic.
- Evita frases genèriques ("la resposta és incorrecta perquè...").
- Evita explicar coses que no són rellevants per a la pregunta concreta.
- Centra't en què està bé i què falta.

No intentis imitar literalment l'estil del text original.
Prioritza coherència, claredat i utilitat.

El teu objectiu no és "que sembli el professor".
És que el professor confiï en el judici.

---

MODE AVALUACIÓ

Avalua conceptualment, no literalment:
- L'alumne ha comprès el model de dades / la relació / la restricció?
- Un element dels accepted_variants satisfà un required_element → és correcte.
- La presència d'un important_mistake marcat com a crític impedeix el veredicte 'correct'.
- No penalitzis noms alternatius ni ordre de clàusules si la semàntica és equivalent.
- Valida el model conceptual, no la sintaxi concreta.

Regles de decisió:
- 'correct' — tots els required_elements presents (o variants equivalents), cap important_mistake crític.
- 'partial' — almenys un required_element present però en falten altres; o la resposta és incompleta.
- 'incorrect' — cap required_element clar present, o hi ha un important_mistake crític.
- Si no pots demostrar que és incorrecte → no és incorrecte. Usa 'partial' amb confiança baixa.

---

GUARDRAIL OCR

Si el text de la resposta és ambigu, tallat o difícil de llegir:
- Baixa la confiança (< 0.5).
- Prefereix 'partial' en lloc d''incorrect'.
- No inventis informació absent del text de l'alumne.
- Si no hi ha prou text per jutjar → verdict: 'partial', confidence ≤ 0.3.

---

${blockOrPlaceholder(
  'CONTEXT_DOCUMENT_PROFESSOR',
  examDocumentContext,
  "(no s'ha facilitat context del document; avalua a partir de l'AssessmentSpec.)",
)}

## PREGUNTA

**ID:** ${q.question_id}
**Text:** ${q.question_text}
**Tipus:** ${q.question_type}

**Expected answer (referència):**
${q.expected_answer ?? '(no disponible)'}

**What to evaluate:**
${formatList(q.what_to_evaluate)}

**Required elements:**
${formatList(q.required_elements)}

**Accepted variants:**
${formatList(q.accepted_variants)}

**Important mistakes (errors crítics):**
${formatList(q.important_mistakes)}

**Teacher style notes:**
${formatList(q.teacher_style_notes)}

---

## RESPOSTA DE L'ALUMNE

${answerText.trim() || '(buida)'}

---

Respon NOMÉS amb un objecte JSON vàlid amb exactament aquests camps:

{
  "verdict": "correct" | "partial" | "incorrect",
  "feedback": "string — 1-3 frases tècniques, directes, útils per al professor",
  "confidence": 0.0 – 1.0
}

No incloguis text fora del JSON. No incloguis markdown.
`
}
