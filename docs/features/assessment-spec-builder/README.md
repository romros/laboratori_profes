# Feature 2 — Assessment Spec Builder

**Estat: implementada (MVP + contracte fort 2.2)** — extracció + enriqueiment pedagògic, schema estable, **dues passades LLM** amb models per fase: passada 1 per defecte `gpt-5.4`, passada 2 per defecte `gpt-5.4`. Client `chat/completions` per a aquests models; **`gpt-5.4-pro`** només com a opció experimental (`/v1/responses`).

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

### Feature 2.1 — Enriqueiment pedagògic (segon prompt)

Amb un `AssessmentSpec` ja vàlid (mateix schema, sense camps nous), el servei `enrichAssessmentSpec` fa una **segona passada LLM** que millora només, per pregunta, els camps pedagògics: `what_to_evaluate`, `required_elements`, `important_mistakes`, `teacher_style_notes` i, sota control, `accepted_variants` (només variants **addicionals** compatibles amb `expected_answer` del base). La **veritat documental** del professor (`question_text`, `max_score`, `question_type`, `expected_answer`, confiances, etc.) **no es fusiona des del model** — el prompt (Feature **2.1b**) ho blinda explícitament; el merge només aplica els camps pedagògics del JSON retornat.

- **Context al prompt (2.1b):** `enrichAssessmentSpec` crida `buildEnrichAssessmentSpecPrompt({ specJson, examText, solutionText })`; el cos del missatge usuari inclou **tres blocs** (`ASSESSMENT_SPEC_BASE`, `ENUNCIAT ORIGINAL`, `SOLUCIONARI ORIGINAL`). El pipeline `buildAssessmentSpecWithPedagogicEnrichment` reenvia els **mateixos** `examText` / `solutionText` que `buildAssessmentSpec`. **Prova a CI:** `enrichAssessmentSpecPrompt.test.ts` (sentinels del fixture hospital dins del prompt). **I/O de la cadena al repo:** carpeta `examples/hospital-daw-chain/` — `pass1-output.json`, `pass2-user-payload.txt`, `pass2-llm-response.json`, `pass2-after-merge.json` (merge calculat sense API; veure README d’aquesta carpeta). Regenerar: `npm run write:assessment-spec-hospital-chain -w @profes/frontend`. Referència addicional: `quick-sample-v1-output.json`. Si crides `enrichAssessmentSpec` sol sense `examText`/`solutionText`, el prompt usa placeholders explícits.
- **Pipeline de codi:** `buildAssessmentSpecWithPedagogicEnrichment` → `buildAssessmentSpec` i després `enrichAssessmentSpec`.
- **HTTP (JSON):** camp opcional `pedagogic_enrichment: true` al cos de la petició d’`executeAssessmentSpecBuildFromJsonBody` per obtenir directament l’spec enriquit.
- **Prova d’integració:** `tests/integration/assessment-spec-builder/enrichAssessmentSpec.hospital.test.ts` (fixture `hospitalDawGolden.real-output.json`; requereix clau API com el golden de Feature 2).

### Feature 2.2 — Contracte fort entre passada 1 (operativa) i passada 2 (pedagògica)

Les dues passades tenen **rols explícits i separats** al prompt:

| Passada | Rol | Prompt | Comportament |
|---------|-----|--------|--------------|
| 1 (`buildAssessmentSpec`) | **MODE OPERATIU — Parser fidel** | `buildAssessmentSpecPrompt` | Copia el professor: extreu fidelment sense inventar, sense criteris, sense deduir estructures no descrites a l’enunciat. |
| 2 (`enrichAssessmentSpec`) | **MODE PEDAGÒGIC — Lector docent** | `enrichAssessmentSpecPrompt` | Pensa com el professor: interpreta el model conceptual, accepta variants equivalents, no exigeix literalitat de noms d’implementació absents de l’enunciat. |

**Regla per a `required_elements` (passada 2):** un nom de taula/columna que **no apareix a l’enunciat** no pot ser un `required_element` — ha de ser un `accepted_variant`. Exemple: `tractament_pacient_metge` és una implementació del solucionari; el que cal avaluar és la relació N:M conceptual (veure [anàlisi Q11](q11-contract-analysis.md)).

**Variables de model:**

| Variable | Passada | Per defecte (codi) |
|----------|---------|---------------------|
| `ASSESSMENT_SPEC_MODEL` | 1 — extracció / `AssessmentSpec` base | `gpt-5.4` |
| `ASSESSMENT_SPEC_ENRICH_MODEL` | 2 — enriqueiment pedagògic | `gpt-5.4` |

El client HTTP (`callOpenAiCompatibleChatWithMeta`) enruta automàticament: **`gpt-5.4-pro` (i altres configurats) → `POST /v1/responses`**; la resta → `POST /v1/chat/completions`. **`gpt-5.4-pro` no és el default:** només s’usa si poses `ASSESSMENT_SPEC_ENRICH_MODEL=gpt-5.4-pro` (experimental: latència i cost alts). Models addicionals només Responses: `OPENAI_RESPONSES_API_MODELS` (llista separada per comes). Per forçar sempre chat (p. ex. proxy sense `/responses`): `OPENAI_FORCE_CHAT_COMPLETIONS=1`.

Compatibilitat: si només existeix `ASSESSMENT_SPEC_OPENAI_MODEL`, s’aplica a **ambdues** passades (comportament legacy).

Telemetria opcional per calibratge: callback `onLlmRound` (fase, model resolt, `endpointKind` `chat_completions` | `responses`, `latencyMs`, `usage` si l’API el retorna). El client HTTP del producte no l’activa.

**Escript de calibratge (cas hospital, 2 variants per defecte):** `npm run calibration:assessment-spec-models -w @profes/frontend` (requereix clau API; escriu `hospital-model-calibration-notes.md` amb tokens i temps). Amb `CALIBRATION_SAVE_ASSESSMENT_SPEC_JSON=1` es desen **base** (passada 1) i **enriquit** (passada 2) per variant a `calibration-outputs/` (vegeu `calibration-outputs/README.md`). **Cost USD:** no ve al cos de l’API; cal multiplicar tokens per tarifes vigents o mirar el dashboard OpenAI (ho resumeix el mateix fitxer de notes).

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
- Optimització pedagògica més enllà del pipeline 2.0+2.1 (sense revisió humana obligatòria)
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

---

## Tancament de Feature 2 — DONE (2026-03-23)

### Què queda resolt

- `AssessmentSpec` complet amb dues passades LLM i contractes explícits.
- Passada 1 (MODE OPERATIU): extracció fidel, zero inferència no explícita, `question_text` literal de l'enunciat.
- Passada 2 (MODE PEDAGÒGIC): interpretació conceptual, `accepted_variants` per noms d'implementació absents de l'enunciat, no literalisme innecessari.
- Golden hospital validat (15 preguntes, `gpt-5.4` les dues passades).
- Chain versionada a `examples/hospital-daw-chain/`.
- Q11 resolt conceptualment: `tractament_pacient_metge` és `accepted_variant`, no `required_element` (veure [q11-contract-analysis.md](q11-contract-analysis.md)).
- Tests de contracte de prompt garanteixen que els rols no regressin.

### Què NO resol Feature 2

- **Grading real** de respostes d'alumnes → Feature 3.
- **Scoring / nota final** → Feature 3.
- **Feedback a l'alumne** → Feature 3.
- Calibratge continu de models (la decisió model és a `hospital-model-calibration-notes.md`).
- Persistència estable per convocatòria → pendent PM.
- UI de revisió del professor → pendent PM.

### Per què és suficient per passar a Feature 3

Feature 3 necessita un `AssessmentSpec` vàlid per pregunta: `question_id`, `expected_answer`, `what_to_evaluate`, `required_elements`, `accepted_variants`, `important_mistakes`. Feature 2 els genera, els valida via Zod, i els deixa persistits al golden. El contracte fort entre passades garanteix que `required_elements` sigui conceptual (no literal), cosa que evita falsos negatius en Feature 3.

### Anti-patterns a evitar a partir d'ara

- Barrejar el rol de passada 1 i passada 2 (p.ex. afegir criteri pedagògic a passada 1).
- Reintroduir literalisme a passada 2 (p.ex. fer `required_element` d'un nom de taula absent de l'enunciat).
- Fer grading directament des del solucionari sense passar per `AssessmentSpec` — Feature 2 és la capa d'abstracció.
- Recalcular `AssessmentSpec` en cada avaluació (ha de ser persistent per convocatòria).

### Evidència de tancament

| Verificació | Commit | Resultat |
|-------------|--------|---------|
| Prompts MODE OPERATIU / MODE PEDAGÒGIC | `cf20c32` | ✅ |
| Tests de contracte (8 nous asserts) | `cf20c32` | ✅ 241 tests OK |
| Q11 analitzat i documentat | `cf20c32` | ✅ |
| Golden hospital `gpt-5.4` × 2 passades | `bbb905b` / `355a091` | ✅ |
| Validació Docker (`test lint typecheck`) | 2026-03-23 | ✅ |
