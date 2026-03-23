/**
 * Segon pas LLM: enriqueix criteris pedagògics d'un AssessmentSpec ja vàlid (Feature 2.1 / 2.1b).
 */

export type BuildEnrichAssessmentSpecPromptParams = {
  /** JSON stringificat de l'AssessmentSpec base (font de veritat documental). */
  specJson: string
  /** Context de suport; no és permís per reescriure camps base. */
  examText?: string
  solutionText?: string
}

function blockOrPlaceholder(label: string, content: string | undefined, emptyNote: string): string {
  const body = content != null && content.trim().length > 0 ? content.trim() : emptyNote
  return `## ${label}\n\n${body}\n`
}

export function buildEnrichAssessmentSpecPrompt(
  params: string | BuildEnrichAssessmentSpecPromptParams,
): string {
  const p: BuildEnrichAssessmentSpecPromptParams =
    typeof params === 'string' ? { specJson: params } : params
  const { specJson, examText, solutionText } = p

  return `Ets un professor expert que ha dissenyat aquest examen.

El teu objectiu és transformar uns criteris d'avaluació genèrics en criteris pedagògics concrets, útils per avaluar correctament un alumne.

Treballes amb:
- el nivell d'una classe real de FP d'informàtica (i, si el contingut no és tècnic, adapta el to al domini de l'examen)
- alumnes amb errors habituals
- un context docent real (no teòric)

Els exemples següents amb SQL són només il·lustratius quan la pregunta és de bases de dades; per a altres tipus de pregunta, genera criteris observables del mateix estil per al domini concret.

---

REGLA ZERO — IMMUTABILITAT DEL SPEC BASE (VERITAT DOCUMENTAL DEL PROFESSOR)

Els camps ja plens a l'AssessmentSpec base (bloc ASSESSMENT_SPEC_BASE) representen la **veritat documental** extreta del material del professor. **No els reobris.**

No has de:
- reinterpretar-los
- corregir-los
- normalitzar-los cap a un altre esquema
- adaptar-los al teu criteri
- substituir-los per variants teves

Això aplica **especialment** a:
- question_text
- max_score
- question_type
- expected_answer
- extraction_confidence
- inference_confidence

El sistema **no** aplicarà cap canvi teu en aquests camps: es descarten. La teva responsabilitat és **no** proposar-ne de contradictoris al JSON (evita confusió al model).

La teva feina és **només** enriquir pedagògicament aquests camps (per cada pregunta, mateix question_id):
- what_to_evaluate
- required_elements
- important_mistakes
- teacher_style_notes
- accepted_variants: **només** si afegeixes variants **realment compatibles** amb la resposta esperada del base (mai substitueixis la solució del professor ni contradiguis expected_answer)

---

CONTEXT ORIGINAL (NOMÉS SUPORT PEDAGÒGIC)

Els blocs ENUNCIAT ORIGINAL i SOLUCIONARI ORIGINAL (si n'hi ha) serveixen **únicament** per entendre millor:
- què vol avaluar el professor
- quin nivell exigeix
- què és important conceptualment

**No** els facis servir per reescriure question_text, expected_answer ni cap altre camp del spec base.
Si detectes contradicció entre el context i el spec base, **no corregeixis el base**: limita't a enriquir amb prudència dins dels camps pedagògics permès.

---

ORDRE DE LECTURA

1. ASSESSMENT_SPEC_BASE (font canònica)
2. ENUNCIAT ORIGINAL / SOLUCIONARI ORIGINAL (context)
3. Regles següents i format de sortida

${blockOrPlaceholder('ASSESSMENT_SPEC_BASE', specJson, '(buit — error)')}

${blockOrPlaceholder(
  'ENUNCIAT ORIGINAL',
  examText,
  "(no s'ha facilitat text d'enunciat en aquesta petició; confia en l'AssessmentSpec base.)",
)}

${blockOrPlaceholder(
  'SOLUCIONARI ORIGINAL',
  solutionText,
  "(no s'ha facilitat solucionari en aquesta petició; confia en l'AssessmentSpec base.)",
)}

---

Has de REESCRIURE (millorar) **només** els camps pedagògics següents per cada pregunta:

- what_to_evaluate
- required_elements
- important_mistakes
- teacher_style_notes
- accepted_variants (opcional: només variants addicionals compatibles amb expected_answer del base)

OBJECTIU:

Convertir criteris genèrics en criteris concrets, observables i pedagògicament útils.

---

REGLA 1 — CRITERIS OBSERVABLES

Cada element ha de ser verificable en la resposta de l'alumne.

Incorrecte (massa genèric):
- "sintaxi SQL correcta"

Correcte (observable):
- "la consulta inclou una clàusula WHERE amb la condició correcta"
- "la taula defineix una PRIMARY KEY"
- "s'utilitza ON DELETE CASCADE en la relació"

---

REGLA 2 — CENTRAT EN L'ALUMNE

Pensa: què ha d'haver entès l'alumne per fer bé aquesta pregunta?

Els criteris han de reflectir comprensió, no només forma.

---

REGLA 3 — NIVELL REALISTA

- evita perfeccionisme excessiu
- accepta variants raonables
- reflecteix errors habituals

---

REGLA 4 — REQUIRED_ELEMENTS

Inclou només el que és imprescindible perquè la resposta sigui correcta.

---

REGLA 5 — IMPORTANT_MISTAKES

Descriu errors que indiquin manca de comprensió o errors conceptuals.

---

REGLA 6 — WHAT_TO_EVALUATE

Llista curta (3–5 ítems) amb els punts clau a observar. No genèrics.

---

REGLA 7 — TEACHER_STYLE_NOTES

Notes breus (2–3 màxim): com valoraria el professor, què prioritzaria, quin tipus d'error toleraria o no.

---

REGLA 8 — ESTRUCTURA I EMPARELLAMENT

- no afegeixis camps nous ni eliminis camps del schema
- cada element de \`questions\` ha de tenir el mateix \`question_id\` que a l'entrada (mateix nombre i ordre)
- el sistema només aplica del teu JSON els camps pedagògics indicats (més \`question_id\` per emparellar); la resta roman del spec base

---

REGLA 9 — NO SCORING

- no assignis puntuacions
- no facis subpuntuacions
- no creïs rúbriques numèriques

---

REGLA 10 — FORMAT

Respon NOMÉS amb un JSON vàlid: preferiblement l'objecte AssessmentSpec complet o un objecte amb \`questions[]\` on cada ítem inclogui com a mínim \`question_id\` i els camps pedagògics que has de millorar.

No incloguis text fora del JSON.
No incloguis markdown.
`
}
