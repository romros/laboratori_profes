# Feature 2 — Assessment Spec Builder

**Estat: definició formal — no implementada**

---

## Propòsit

Feature 2 converteix els materials del professor (enunciat + solucionari) en un artefacte estructurat canònic: l'`AssessmentSpec`.

Està pensat per ser **transversal** (qualsevol assignatura), amb especial atenció als casos **tècnics i de FP** (cicles formatius, mòduls d’informàtica i afins: programació, sistemes, xarxes, web, dades, etc.): el solucionari pot ser codi, SQL, configuracions, text tècnic o respostes obertes — el model ha d’inferir el domini a partir del material, **sense assumir que tot és SQL**.

L'`AssessmentSpec` és la representació oficial del criteri d'avaluació del professor. Es calcula un cop i es reutilitza en totes les avaluacions posteriors (Feature 3).

**No és avaluació.** No toca dades d'alumnes. És una transformació sobre materials del professor.

---

## Encaix al pipeline

```
Feature 0 → template del professor → zones de resposta per pregunta
Feature 1 → scan d'alumne → text de resposta per pregunta (OCR)
Feature 2 → enunciat + solucionari del professor → AssessmentSpec (criteri estructurat)
Feature 3 → (Feature 0 o 1) + Feature 2 → avaluació per pregunta
```

Feature 2 és **prerequisit de Feature 3**, però **independent de Feature 0 i Feature 1**.

---

## Inputs

### Formats acceptats

| Input | Descripció | Obligatori |
|-------|------------|------------|
| Solucionari | Document amb les respostes correctes del professor | Sí |
| Enunciat / maqueta | PDF o text de l'examen (per context de les preguntes) | Recomanat |
| Notes del professor | Criteris addicionals, variants acceptades, errors típics | Opcional |

### Formats de document

- **PDF amb text embegut** (cas principal)
- **Text lliure estructurat** (el professor escriu directament)

> **MVP assumeix materials textuals llegibles sense OCR addicional.**
> Solucionaris escanejats a mà queden fora d'abast del MVP (mateix límit que Feature 0 Capa 1).

El **prompt** del servei (`buildAssessmentSpecPrompt`) exigeix sortida JSON estricta, preguntes només de l’enunciat, separació extracció/inferència i límits de tamany en criteris inferits; el golden hospital i `hospitalDawGolden.real-output.json` es regeneren amb clau API quan calgui alinear snapshot i codi.

---

## Output: `AssessmentSpec`

```typescript
type AssessmentSpec = {
  exam_id: string
  title?: string
  questions: QuestionSpec[]
}

type QuestionSpec = {
  question_id: string

  /** Text de la pregunta extret de l'enunciat. */
  question_text: string

  /** Puntuació màxima. Null si no especificada al material. */
  max_score: number | null

  /**
   * Tipus de pregunta — camp obert (string); el producte és transversal (FP, tècniques, general).
   * El model infereix l'etiqueta segons el domini (programació, xarxes, web, dades/SQL, text obert, etc.).
   * Exemples il·lustratius: 'short_text', 'code_python', 'markup_html', 'sql_insert', 'network_subnetting'.
   */
  question_type: string

  /** Resposta esperada extreta fidelment del solucionari (sense inferència). */
  expected_answer: string

  /** Aspectes concrets que cal avaluar (inferits o extrets). */
  what_to_evaluate: string[]

  /** Elements imprescindibles (absència → penalització). */
  required_elements: string[]

  /** Variants de resposta acceptables. */
  accepted_variants: string[]

  /** Errors típics que invaliden o penalitzen la resposta. */
  important_mistakes: string[]

  /** Notes d'estil o criteri del professor (subjectivitat explícita). */
  teacher_style_notes: string[]

  /**
   * Confiança de l'extracció [0, 1].
   * Baix si el solucionari és ambigu o incomplet per a aquesta pregunta.
   */
  confidence: number
}
```

---

## Principis de disseny

### Extracció fidel vs inferència — separació explícita

| Camp | Tipus | Font |
|------|-------|------|
| `question_text` | Extracció fidel | Enunciat |
| `expected_answer` | Extracció fidel | Solucionari |
| `max_score` | Extracció fidel | Enunciat o solucionari |
| `what_to_evaluate` | Inferència | LLM sobre solucionari |
| `required_elements` | Inferència | LLM sobre solucionari |
| `accepted_variants` | Inferència | LLM sobre solucionari |
| `important_mistakes` | Inferència | LLM sobre solucionari |
| `teacher_style_notes` | Extracció + inferència | Notes del professor |

La separació és important: `expected_answer` mai s'inventa — és el que el professor ha escrit. La inferència és addenda, no substitut.

### Output persistent — font de veritat única

**`AssessmentSpec` és l'única font de veritat per a Feature 3. Feature 3 no ha de dependre directament del solucionari original.**

L'`AssessmentSpec` es calcula un cop per convocatòria i es persisteix. Feature 3 el llegeix; no el recalcula en runtime de correcció. Això garanteix consistència entre correccions i evita el patró prohibit de passar el PDF del solucionari al LLM en cada avaluació.

### Sense dades d'alumnes

Feature 2 no processa cap document d'alumne. Els materials d'entrada (enunciat, solucionari, notes) són del professor. No hi ha restricció d'enviament a LLM extern (a diferència de Feature 0 Capa 2 i Feature 1).

---

## Fora d'abast (MVP)

- Correcció d'alumnes → Feature 3
- Scoring global → Feature 3
- OCR de solucionari manuscrit
- UI final de gestió d'specs
- Rúbriques amb ponderació complexa per subapartats
- Optimització pedagògica automàtica
- Versionat d'`AssessmentSpec` entre convocatòries

---

## Relació amb les altres features

| Feature | Relació |
|---------|---------|
| Feature 0 Capa 2 | Proporciona `answer_text_clean` per pregunta (input de Feature 3, no de Feature 2) |
| Feature 1 | Proporciona `answer_text` per pregunta (input de Feature 3, no de Feature 2) |
| Feature 2 | Proporciona `AssessmentSpec` (input de Feature 3) |
| Feature 3 | Consumeix Feature 0/1 + Feature 2 per avaluar |

Feature 2 **no depèn** de Feature 0 ni Feature 1. Es pot construir l'`AssessmentSpec` independentment de si hi ha scans d'alumnes.

---

## Decisions obertes (per PM + implementació)

| Decisió | Opcions | Impacte |
|---------|---------|---------|
| Format de persistència de l'`AssessmentSpec` | JSON fitxer / BD | Portabilitat vs consulta |
| Revisió humana obligatòria? | Sempre / només `confidence < threshold` | Flux professor |
| LLM extern o local per inferència | API externa / model local | Privadesa, cost |
| Granularitat de `required_elements` | Per línia / per bloc semàntic | Precisió d'avaluació |

---

## Quan implementar

El primer artefacte de codi serà:

1. **Schema TypeScript** — `domain/assessment-spec/assessmentSpec.schema.ts`
2. **Primer prompt LLM controlat** — extracció estructurada sobre solucionari de prova
3. **Harness** — validació manual sobre l'examen real (DAW SQL)
