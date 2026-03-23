# Feature 3 — Answer Evaluator

**Estat: definida, pendent d'implementació**

Avalua les respostes OCR d'un alumne contra un `AssessmentSpec` i produeix un veredicte pedagògic per pregunta. Prerequisit: Feature 2 (DONE).

---

## Propòsit

Feature 3 és la capa que **jutja**: pren el criteri del professor (Feature 2) i les respostes de l'alumne (Feature 0/1) i decideix, per cada pregunta, si la resposta és correcta, parcial o incorrecta — i per quin motiu.

No genera notes finals. No accedeix a PDFs directament. No recalcula l'`AssessmentSpec`.

---

## Encaix al pipeline

```
Feature 0 → layout mapping → answer_text_clean per pregunta
Feature 1 → OCR segmentat  → answer_text per pregunta
Feature 2 → materials professor → AssessmentSpec (criteri)
Feature 3 → answer_text + AssessmentSpec → QuestionEvaluation per pregunta
```

Feature 3 consumeix els outputs de Feature 0 o Feature 1, i el de Feature 2. No en produeix cap per a una feature posterior — és la capa de judici final per al professor.

---

## Inputs del MVP

| Input | Font | Obligatori |
|-------|------|------------|
| `AssessmentSpec` | Feature 2 (persistit, no recalculat) | Sí |
| `answer_text` per pregunta | Feature 0 (`answer_text_clean`) o Feature 1 (`answer_text`) | Sí |
| `ocr_status` per pregunta | `QuestionAnswerItemStatus` (`ok \| empty \| uncertain`) | Sí |
| `ocr_confidence` | `TemplateMappedAnswer.match.confidence` (si ve de Feature 0) | Opcional |

**La veritat documental sempre ve de Feature 2.** Feature 3 no toca ni interpreta PDFs.

---

## Output: `QuestionEvaluation`

Per cada pregunta de l'`AssessmentSpec`:

```typescript
type QuestionEvaluation = {
  question_id: string

  /**
   * Si la resposta OCR és avaluable.
   *
   * - 'yes'    — text suficient i qualitat OCR acceptable per jutjar
   * - 'review' — OCR dubtós, text massa curt, o cas límit → cal revisió humana
   * - 'no'     — text buit, OCR il·legible, o pregunta no detectada
   */
  evaluable_by_ocr: 'yes' | 'review' | 'no'

  /**
   * Veredicte pedagògic. Null si evaluable_by_ocr !== 'yes'.
   *
   * - 'correct'   — la resposta compleix els required_elements i no cau en important_mistakes
   * - 'partial'   — compleix alguns required_elements però no tots, o hi ha errors menors
   * - 'incorrect' — falta un o més required_elements clau, o cau en un important_mistake
   */
  verdict: 'correct' | 'partial' | 'incorrect' | null

  /**
   * Explicació del veredicte: per quin motiu s'ha decidit, quins elements s'han
   * detectat o no detectat. Orientat al professor, no a l'alumne.
   * Null si evaluable_by_ocr !== 'yes'.
   */
  feedback: string | null

  /**
   * Confiança del veredicte [0, 1]. Null si evaluable_by_ocr !== 'yes'.
   * Baix si la resposta és ambigua o l'OCR és incert.
   */
  confidence: number | null
}

type ExamEvaluationResult = {
  exam_id: string
  questions: QuestionEvaluation[]
}
```

**Nota sobre scoring:** el MVP **no** retorna `score` numèric per pregunta ni nota global. Això és una decisió deliberada: la policy de puntuació parcial és responsabilitat del professor, no del sistema. El professor rep `verdict` + `feedback` i decideix la nota. Scoring pot arribar com a Feature 3.x si PM ho demana.

---

## Decisions de disseny del MVP

### A. Política d'avaluabilitat OCR

| Condició | `evaluable_by_ocr` |
|----------|--------------------|
| `status === 'ok'` i text ≥ N chars útils | `'yes'` |
| `status === 'uncertain'` o text molt curt | `'review'` |
| `status === 'empty'` o pregunta `not_detected` | `'no'` |
| OCR confidence < 0.4 (si disponible) | `'review'` |

Guardrail: **Feature 3 mai avalua quan `evaluable_by_ocr === 'no'`**. La crida al LLM no es fa. El veredicte és `null`.

### B. Política de grading

**Conceptual, no literal.** Feature 3 hereda el contracte fort de Feature 2:
- Avalua si l'alumne ha comprès el model conceptual, no si ha escrit exactament la solució.
- Un element d'`accepted_variants` satisfà un `required_element`.
- Un `important_mistake` present → `incorrect` o `partial` (no pot ser `correct`).

**Parcial vs incorrecte:**
- `partial` — almenys un `required_element` present però en falten altres, o la resposta és incompleta.
- `incorrect` — cap `required_element` clar, o hi ha un `important_mistake` definit com a crític.

**Quan no hi ha prou evidència:**
- Si el text és prou llarg però el LLM no pot decidir → `verdict: 'partial'` amb `confidence` baix, no `incorrect`.
- Principi: el dubte beneficia l'alumne; si no es pot dir que és incorrecte, no ho diem.

### C. Relació amb Feature 2

Feature 3 **no llegeix** l'enunciat ni el solucionari originals en temps d'avaluació. Llegeix únicament l'`AssessmentSpec`. Això és una decisió arquitectural ferma:
- L'`AssessmentSpec` és la font de veritat per a Feature 3.
- Si el professor vol canviar el criteri, regenera l'`AssessmentSpec` (Feature 2), no modifica Feature 3.
- Prevents el patró prohibit: enviar PDFs d'alumnes a LLM extern.

### D. Un sol LLM call per pregunta (MVP)

El MVP fa una crida LLM per pregunta avaluable. El prompt inclou:
- `question_text` (de l'AssessmentSpec)
- `expected_answer` (de l'AssessmentSpec)
- `what_to_evaluate` + `required_elements` + `accepted_variants` + `important_mistakes`
- `answer_text` de l'alumne

No es fa un prompt global per tot l'examen. Cada pregunta és independent.

---

## Feature 3 NO inclou (MVP)

- Scoring numèric per pregunta ni nota global → Feature 3.x / PM
- Feedback directe a l'alumne (el feedback és per al professor)
- Batch massiu d'alumnes (un alumne per crida al MVP)
- Export a format extern (PDF, CSV, etc.)
- Calibratge de models de Feature 3
- Política completa de nota (ponderat, arrodoniment, etc.)
- OCR propi — Feature 3 consumeix text extret per Feature 0/1, no fa OCR
- Processament de respostes gràfiques (diagrames, dibuixos) — fora d'abast

---

## Privadesa

Feature 3 **envia text d'alumne a LLM extern** per fer la evaluació. Això és acceptable si:
- El text enviat és `answer_text` (resposta OCR), no el PDF original.
- No s'inclou NIF, nom, ni cap altra dada personal de l'alumne.
- El wiring ha d'anonimitzar o assegurar que `answer_text` no conté dades personals.

Decisió de producte: **la responsabilitat d'anonimització és del caller**, no de Feature 3. Feature 3 no sanititza el text d'entrada; el caller ha d'assegurar que no hi ha dades personals.

---

## Inputs normalitzats — adaptadors d'entrada

Feature 3 no consumeix directament `TemplateMappedAnswersResult` ni `QuestionAnswerExtractionResult`. Usa un tipus normalitzat intermedi:

```typescript
type AnswerForEvaluation = {
  question_id: string
  answer_text: string       // text net per avaluar
  ocr_status: 'ok' | 'empty' | 'uncertain'
  ocr_confidence?: number   // [0,1] si disponible (Feature 0)
}
```

Els adaptadors de Feature 0 i Feature 1 converteixen els seus outputs a aquest tipus. Això desacobla Feature 3 dels detalls d'extracció.

---

## Criteri de tancament del MVP

Feature 3 MVP estarà DONE quan:

- [ ] Schema `QuestionEvaluation` + `ExamEvaluationResult` definit i validat via Zod
- [ ] `evaluateAnswer(question: QuestionSpec, answer: AnswerForEvaluation): QuestionEvaluation` — servei base
- [ ] Política d'`evaluable_by_ocr` implementada i testada (sense LLM)
- [ ] Prompt de jutge LLM: mode `AVALUADOR PEDAGÒGIC` — llegeix AssessmentSpec, jutja la resposta, retorna veredicte + feedback + confidence
- [ ] Golden test hospital: almenys 5 preguntes amb resposta simulada, veredictes esperats coneguts
- [ ] Cas `evaluable_by_ocr: 'no'` — el LLM no es crida, veredicte null
- [ ] Cas `accepted_variants` — variant equivalent → `correct`, no `incorrect`
- [ ] Cas `important_mistake` — error crític present → no pot ser `correct`
- [ ] `confidence` baix quan text és ambigu, alt quan és clar
- [ ] Tests unitaris: política OCR, merge del veredicte, casos límit
- [ ] Validació Docker: lint + typecheck + test OK
- [ ] Docs actualitzats: README + ESTAT.md

**No DONE si:**
- El sistema retorna `incorrect` sense evidència clara (violació del principi de dubte)
- El sistema avalua quan `evaluable_by_ocr === 'no'`
- El sistema llegeix l'enunciat/solucionari originals en temps d'avaluació
- `accepted_variants` no s'honora com a equivalent de `required_element`
- No hi ha tests de cas `empty` / `not_detected`

---

## Preguntes obertes (per PM abans d'implementar)

| Pregunta | Impacte |
|----------|---------|
| Cal retornar un `score` numèric al MVP o és una Feature 3.x? | Complexitat i responsabilitat de nota |
| El feedback és per al professor o eventual feedback a alumne? | Nivell de detall, to del prompt |
| Com s'identifica l'alumne al resultat? (`student_id` extern o anònim)? | Schema + privadesa |
| Batch d'alumnes al MVP o un per un? | Arquitectura d'endpoint i cost API |
| Cal persistir `ExamEvaluationResult` o és stateless per crida? | Integració amb producte futur |

---

## Refs

- **Feature 2 (prerequisit):** `docs/features/assessment-spec-builder/README.md`
- **Feature 0 (input):** `domain/template-mapped-answers/templateMappedAnswers.schema.ts`
- **Feature 1 (input):** `domain/question-answer-extraction/question_answer_extraction.schema.ts`
- **AssessmentSpec schema:** `domain/assessment-spec/assessmentSpec.schema.ts`
- **Privadesa OCR:** `docs/features/question-answer-extraction/README.md` §Restricció permanent
