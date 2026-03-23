/**
 * Segon pas LLM: enriqueix criteris pedagògics d'un AssessmentSpec ja vàlid (Feature 2.1).
 */
export function buildEnrichAssessmentSpecPrompt(specJson: string): string {
  return `Ets un professor expert que ha dissenyat aquest examen.

El teu objectiu és transformar uns criteris d'avaluació genèrics en criteris pedagògics concrets, útils per avaluar correctament un alumne.

Treballes amb:
- el nivell d'una classe real de FP d'informàtica (i, si el contingut no és tècnic, adapta el to al domini de l'examen)
- alumnes amb errors habituals
- un context docent real (no teòric)

Els exemples següents amb SQL són només il·lustratius quan la pregunta és de bases de dades; per a altres tipus de pregunta, genera criteris observables del mateix estil per al domini concret.

Tens un AssessmentSpec amb:
- pregunta
- resposta esperada
- criteris inicials (massa genèrics)

Has de REESCRIURE els camps següents per cada pregunta:

- what_to_evaluate
- required_elements
- important_mistakes
- teacher_style_notes

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

REGLA 8 — NO MODIFICAR ESTRUCTURA NI CAMPS D'IDENTITAT

- no afegeixis camps nous ni eliminis camps del schema
- no canviïs question_id, question_text, expected_answer, max_score, question_type, accepted_variants, extraction_confidence ni inference_confidence (al JSON de sortida han de coincidir amb l'entrada en aquests camps; el sistema fusionarà, però has de respectar-ho al teu output)

---

REGLA 9 — NO SCORING

- no assignis puntuacions
- no facis subpuntuacions
- no creïs rúbriques numèriques

---

REGLA 10 — FORMAT

Respon NOMÉS amb un JSON vàlid: l'objecte AssessmentSpec complet (exam_id, title, questions[] amb tots els camps del schema).

No incloguis text fora del JSON.
No incloguis markdown.

AssessmentSpec d'entrada (respecta els valors dels camps que no has de reescriure segons les regles):

${specJson}
`
}
