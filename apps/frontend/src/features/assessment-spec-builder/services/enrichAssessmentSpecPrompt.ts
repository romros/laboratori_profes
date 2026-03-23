/**
 * Segon pas LLM: enriqueix criteris pedagògics d'un AssessmentSpec ja vàlid (Feature 2.1 / 2.1b).
 */

export type BuildEnrichAssessmentSpecPromptParams = {
  /** JSON stringificat de l'AssessmentSpec base (font de veritat documental). */
  specJson: string
  /** Context de suport; no és permís per reescriure camps base. */
  examText?: string
  solutionText?: string
  /**
   * Text anterior al llistat de preguntes: model relacional, restriccions globals,
   * instruccions generals. Obtingut via `extractDocumentContext`.
   * Guardrail: serveix per contextualitzar, NO per inventar criteris ni reescriure el base spec.
   */
  examDocumentContext?: string
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
  const { specJson, examText, solutionText, examDocumentContext } = p

  return `Ets un professor expert que ha dissenyat aquest examen.

El teu objectiu és transformar uns criteris d'avaluació genèrics en criteris pedagògics concrets, útils per avaluar correctament un alumne.

Treballes amb:
- el nivell d'una classe real de FP d'informàtica (i, si el contingut no és tècnic, adapta el to al domini de l'examen)
- alumnes amb errors habituals
- un context docent real (no teòric)

Els exemples següents amb SQL són només il·lustratius quan la pregunta és de bases de dades; per a altres tipus de pregunta, genera criteris observables del mateix estil per al domini concret.

---

MODE PEDAGÒGIC — ROL: LECTOR DOCENT (OBLIGATORI)

El teu rol és interpretar el model conceptual i aplicar criteri docent. No ets un parser en aquesta passada.

OBLIGATORI (passada 2):
- Pensa com el professor: avalua si l'alumne ha comprès el model conceptual, no si ha escrit exactament la mateixa implementació.
- Accepta variants equivalents: si l'enunciat demana "assignar X a Y" i el solucionari usa una taula de relació N:M, qualsevol solució equivalent (mateixa semàntica relacional, noms de taula o columna raonablement adaptats) és vàlida.
- No exigeixis literalitat de noms d'implementació: si un nom de taula o columna no apareix explícitament a l'enunciat, no pot ser un required_element obligatori — pot ser un accepted_variant o un exemple orientatiu.
- Valida el model conceptual, no la sintaxi concreta: per a una relació N:M entre entitats A i B, el que cal avaluar és que existeixi la taula de relació amb les claus foranes correctes, no que tingui un nom específic.
- Si detectes que el solucionari usa un nom d'implementació que no ve de l'enunciat, afegeix-lo com a accepted_variant, no com a required_element.

DISTINCIÓ CLAU:
- Passada 1 (parser): copia el professor — extreu fidelment, sense inventar.
- Passada 2 (tu): pensa com el professor — interpreta el model, accepta equivalències, aplica criteri docent.

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

Els blocs CONTEXT_DOCUMENT_PROFESSOR, ENUNCIAT ORIGINAL i SOLUCIONARI ORIGINAL (si n'hi ha) serveixen **únicament** per entendre millor:
- el model relacional i les restriccions globals del domini
- què vol avaluar el professor
- quin nivell exigeix
- què és important conceptualment

**No** els facis servir per reescriure question_text, expected_answer ni cap altre camp del spec base.
Si detectes contradicció entre el context i el spec base, **no corregeixis el base**: limita't a enriquir amb prudència dins dels camps pedagògics permès.

**Guardrail CONTEXT_DOCUMENT_PROFESSOR:** el context del document (model relacional, restriccions, instruccions) és suport interpretatiu. No et serveix per inventar criteris nous ni per afegir required_elements que no es puguin verificar a la resposta de l'alumne. Usa'l per entendre les relacions entre taules i el domini, no per ampliar l'abast d'avaluació.

---

ORDRE DE LECTURA

1. CONTEXT_DOCUMENT_PROFESSOR (model relacional, restriccions globals — context interpretatiu)
2. ASSESSMENT_SPEC_BASE (font canònica)
3. ENUNCIAT ORIGINAL / SOLUCIONARI ORIGINAL (context)
4. Regles següents i format de sortida

${blockOrPlaceholder(
  'CONTEXT_DOCUMENT_PROFESSOR',
  examDocumentContext,
  "(no s'ha facilitat context previ del document; confia en l'AssessmentSpec base i l'enunciat.)",
)}

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
