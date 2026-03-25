# Feature 4 — OCR Fallback Server-side Efímer (Privacy-first)

**Estat: SPIKE D DONE** — wiring Feature 4 → Feature 3 validat
**Data definició:** 2026-03-24
**Data implementació:** 2026-03-25
**Prerequisit:** Feature 1 (QAE, DONE) · Feature 3 (Answer Evaluator, MVP)

### Resum d'implementació

- **Motor seleccionat:** PaddleOCR-VL-1.5 via `llama.cpp` + GGUF (CPU, Docker `apps/ocr-fallback/`)
- **Client TS:** `apps/frontend/src/infrastructure/ocr/paddleVlOcrClient.ts`
- **Pipeline complet:** `apps/frontend/scripts/gradeExamFullPipelineSpike.ts` (`npm run spike:grade-exam-full-pipeline`)
- **Resultats validació:** 15/15 preguntes detectades sobre `ex_alumne2.pdf`, `is_match: true`, `confidence: 0.84`
- **Evidència spikes:** `docs/spikes/feature4/spike-vl-gguf.md` · `docs/spikes/feature4/spike-c-comparativa-final.md`

### Proper pas

→ Millorar UX i latència (Feature 4 optimització) o integrar al producte real

---

## Propòsit

Substituir la línia tancada com a VIA MORTA (gate post-OCR heurístic) per una nova línia que millora l'OCR **en origen**, al nostre servidor, de forma efímera i controlada.

No més heurístiques post-OCR. No més intent de rescatar text dolent amb gates. Nova línia: **generar millor text des del principi**.

---

## Context

S'ha demostrat (Feature 3, loop validació OCR gate, iteració 2/4) que:

- El coll d'ampolla del grader és l'OCR/QAE upstream, no el model de judici
- El gate post-OCR ha quedat en VIA MORTA (precision ~33%, distribucions TP≈FP estadísticament indistingibles)
- El text OCR base és sovint semànticament il·legible per a SQL manuscrit
- En aquests casos, el grader textual no és fiable

El problema no és recuperable amb comptadors de tokens. Requereix un OCR millor en origen.

Evidència: `docs/spikes/ocr-gate-loop/iteration-02.md`

---

## Objectiu

Construir un servei server-side, **efímer i privacy-first**, que rebi crops mínims de preguntes/respostes i retorni un text OCR clarament millor que el pipeline base.

**Només extreu text millor.** No corregeix exàmens. No avalua. No usa LLM per decidir res.

---

## Trigger: quan s'activa el fallback

El fallback s'activa quan **totes** les condicions es compleixen:

```
route !== 'text'
AND ocr_status ∈ { 'uncertain', 'not_detected', 'semantically_unreadable' }
```

On `route` ve del router de Feature 3 (`routeQuestionForEvaluation`) i `ocr_status` és el camp del `AnswerForEvaluation`.

**Quan NO s'activa:**

- `route === 'text'` — el text base és prou bo, no cal fallback
- `route === 'skip'` — el text és il·legible fins al punt que el fallback tampoc ajudarà; no enviar
- Mida del crop > límit màxim (veure §Límits operatius)
- Timeout anterior no resolt (no reintentar)

> **Regla crítica:** el fallback és un intent únic. **0 retries.** Si falla o fa timeout, el caller usa el text base original o marca `evaluable_by_ocr: 'review'`. No bloquejar el grader.

---

## Abast funcional

### Entrada

- Crop d'imatge d'una pregunta o fragment de resposta
- **No** PDF complet
- **No** pàgina sencera si no cal
- Formats permesos: PNG, JPEG, WEBP

### Sortida

```typescript
type OcrFallbackResult = {
  extracted_text: string;
  engine: string; // identificador del motor utilitzat (engine-agnostic)
  elapsed_ms: number;
  confidence?: number; // [0, 1] si el motor ho suporta — necessari per orquestrar
  warnings?: string[];
};
```

**Per què `confidence` és necessari:** sense una mesura de confiança del motor, el caller no pot decidir si usar el text millorat o caure de nou al baseline. Un `confidence` baix indica que el fallback tampoc ha pogut extreure res útil.

---

## Límits operatius

Explícits i no negociables:

| Límit                     | Valor (configurable)  | Motiu                                   |
| ------------------------- | --------------------- | --------------------------------------- |
| Mida màxima del crop      | 5 MB                  | Evitar abús i temps de procés excessiu  |
| Timeout màxim per petició | 30 s                  | No bloquejar el grader                  |
| Retries                   | **0** — un sol intent | Evitar acumulació de càrrega i latència |
| Concurrència màxima       | A definir al Spike A  | Evitar saturació del servei             |

Si es supera el timeout o la mida, el servei retorna error HTTP 4xx/5xx i el caller usa el text base. **Mai bloquejar.**

---

## Definició de "millor OCR"

Per evitar que el Spike C sigui subjectiu, un OCR es considera millor si:

1. **Paraules clau recuperables** — es poden identificar keywords tècniques (SQL: `CREATE TABLE`, `PRIMARY KEY`, `VARCHAR`, noms de taules, camps)
2. **Intenció tècnica reconstruïble** — un humà pot entendre el que l'alumne volia escriure, fins i tot amb errors ortogràfics lleus
3. **Menys ambigüitat** — redueix el nombre de tokens on no es pot inferir el significat

No cal mètrica numèrica al Spike C. Criteri binari: **millor / no millor** per crop i motor.

> Exemple: `"YPACHAR(A) PRIMARN XEN"` → `"VARCHAR(4) PRIMARY KEY"` és millor. `"WRKAKL TAEBEL"` → `"WERKLE TABLE"` no és millor (intenció no recuperable).

---

## Requisits de producte

### A. Privacy-first (obligatori)

| Requisit                       | Descripció                                                         |
| ------------------------------ | ------------------------------------------------------------------ |
| Crops mínims                   | Només el fragment estrictament necessari                           |
| Sense persistència d'imatges   | Cap fitxer temporal persistent                                     |
| Sense persistència de text OCR | El resultat no es guarda al servidor                               |
| Processament efímer            | Memòria → resultat → descarta                                      |
| Sense tercers                  | Tot el processament al servidor del professor                      |
| Sense logs amb contingut       | Els logs registren mètriques tècniques, mai contingut              |
| Transport segur                | HTTPS intern Docker                                                |
| Responsabilitat caller         | L'anonimització és responsabilitat del caller, igual que Feature 3 |

> ⚠️ Qualsevol canvi que impliqui enviar imatges a serveis externs requereix **decisió explícita de PM** i actualització de `docs/privacy/PRIVACY_ARCHITECTURE.md §8`.

### B. No toca el grader

La feature és upstream del grader. No ha de:

- Cridar LLM
- Prendre decisions docents
- Classificar correcte/incorrecte
- Conèixer l'`AssessmentSpec`

### C. Fallback, no camí per defecte

El flux normal continua sent OCR base (Tesseract, client-side). Aquesta feature entra **només** quan el trigger és positiu (veure §Trigger). Mai per defecte, mai per tot.

---

## Arquitectura

### Decisió arquitectònica

Servei Python **separat**, en Docker **separat**. No al mateix backend que serveix la pàgina ni al `qae-api` existent.

### Justificació

| Motiu                  | Detall                                                         |
| ---------------------- | -------------------------------------------------------------- |
| Dependències pesades   | Kraken, PaddleOCR, PyTorch/ONNX — incompatibles amb stack Node |
| CPU/RAM diferents      | Processos OCR/ML amb perfil de recursos propi                  |
| Aïllament de seguretat | Superfície d'atac limitada al servei concret                   |
| Operació independent   | Es pot aturar, escalar o substituir sense tocar la resta       |
| Conteniment de dades   | Garantia addicional que el payload no travessa altres serveis  |

### Flux

```
frontend / gradeExam
  → route !== 'text' AND ocr_status ∈ {uncertain, not_detected, semantically_unreadable}
  → envia crop mínim (≤5MB, PNG/JPEG/WEBP)
  → [ocr-fallback-api — Python, Docker separat]
      → processa en memòria (timeout 30s)
      → elimina dades temporals
      → retorna OcrFallbackResult { extracted_text, engine, elapsed_ms, confidence? }
  → si confidence >= llindar → grader usa el text millorat
  → si error / timeout / confidence baix → grader usa text base o marca 'review'
```

### Engine-agnostic (obligatori)

La implementació **ha de ser engine-agnostic** des del principi. Interfície única per a múltiples motors; el motor concret és un detall d'implementació que es pot canviar sense tocar l'API ni el caller.

Evita acoplar-te a Kraken o PaddleOCR massa aviat — el Spike B+C decidirà quin guanya.

### Integració amb Feature 3

El router de Feature 3 (`routeQuestionForEvaluation`) ja retorna `route` i `ocr_status`. El Spike D definirà el wiring exacte sense canviar el comportament per defecte del grader.

---

## Requisits tècnics

### Obligatori

| Requisit                  | Detall                                                       |
| ------------------------- | ------------------------------------------------------------ |
| Python                    | Ecosistema OCR/ML natiu                                      |
| API simple                | FastAPI (lleugera, async, OpenAPI automàtic)                 |
| Docker separat            | Contenidor independent al `docker-compose.yml`               |
| Engine-agnostic           | Interfície única per a múltiples motors OCR                  |
| Memòria o temporal efímer | Cap persistència de payload                                  |
| Timeout curt              | 30s màxim per crop (configurable)                            |
| Límit mida fitxer         | 5MB per crop                                                 |
| Formats permesos          | PNG, JPEG, WEBP — rebuig explícit de la resta                |
| 0 retries                 | Un sol intent; error → caller decideix                       |
| Observabilitat            | Mètriques tècniques (temps, motor, warnings) sense contingut |

### Recomanat

| Requisit               | Detall                                                     |
| ---------------------- | ---------------------------------------------------------- |
| CPU primer             | GPU com a optimització futura, no prerequisit              |
| Suport multi-motor     | Kraken, PaddleOCR, i espai per a un tercer                 |
| `confidence` per motor | Si el motor ho suporta, retornar-lo al `OcrFallbackResult` |

---

## Requisits legals / operatius

La feature s'ha de dissenyar com si hagués de passar una revisió de privadesa seriosa.

| Principi                    | Implementació                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| Processament temporal       | Cap dada persisteix més del necessari per retornar la resposta                                 |
| Minimització de dades       | Crop mínim, no pàgina completa ni PDF                                                          |
| Sense persistència          | Ni imatge ni text OCR es guarden al disc                                                       |
| Sense tercers               | Processament 100% local al servidor del professor                                              |
| Crops mínims                | La zona de resposta derivada és el límit; res fora                                             |
| Anonimització és del caller | Feature 4 no sanititza; el caller assegura que el crop no conté dades personals identificables |
| No camí per defecte         | El flux normal no ha de passar per aquí; és el fallback per casos difícils                     |

---

## Decisions obertes (a resoldre als spikes)

Aquesta definició deixa explícitament obertes:

- Quin motor OCR guanya (Kraken vs PaddleOCR vs altres) → Spike B+C
- Si cal segmentació extra pre-OCR → Spike B
- Si cal model especialitzat per a manuscrit SQL → Spike B+C
- Si cal GPU per a rendiment acceptable → Spike B
- Llindar de `confidence` per activar el text millorat vs. caure al baseline → Spike D
- Concurrència màxima del servei → Spike A

---

## Pla de spikes

### Spike A — Contracte i arquitectura

**Objectiu:** definir l'API del servei amb precisió suficient per implementar.

- Especificació OpenAPI de l'endpoint (mida, formats, timeouts, errors, límits)
- Guardrails de privadesa implementats (no com a doc sinó com a codi)
- Interfície engine-agnostic (abstracció Python per als motors)
- Estructura del projecte Python / FastAPI
- Wiring al `docker-compose.yml` (sense integrar amb el frontend encara)

**Entregable:** servei buit que accepta crops i retorna un `OcrFallbackResult` amb text placeholder. Tots els guardrails actius (mida, format, timeout, no-persistència).

---

### Spike B — Comparació d'engines OCR

**Objectiu:** determinar quin motor dóna millors resultats sobre crops difícils reals.

**Candidates:** Tesseract base (baseline) · Kraken · PaddleOCR · (opcional: EasyOCR o similar)

**Mètode:**

- Mateixos crops de `docs/spikes/ocr-gate-loop/dataset.json` que van causar la VIA MORTA
- Cada motor processa cada crop via la interfície engine-agnostic del Spike A
- Output: text cru per motor per crop (+ `confidence` si disponible)

**Entregable:** taula de texts per crop i motor. Sense veredicte subjectiu — el text cru és suficient per a Spike C.

---

### Spike C — Avaluació manual de llegibilitat

**Objectiu:** determinar si algun motor millora substancialment el baseline.

**Criteri de millora** (veure §Definició de "millor OCR"):

- Paraules clau recuperables
- Intenció tècnica reconstruïble
- Menys ambigüitat

**Mètode manual:**

| Crop        | OCR base        | OCR nou         | Millor? |
| ----------- | --------------- | --------------- | ------- |
| alumne-1_Q1 | `YPACHAR(A)...` | `VARCHAR(4)...` | sí / no |

**Entregable:** taula de valoració manual + conclusió de si la línia val la pena.

> Si cap motor millora el baseline de forma clara, declarar VIA MORTA i passar a canal vision. No continuar invertint.

---

### Spike D — Wiring mínim experimental

**Objectiu:** connectar el servei de forma experimental al pipeline de Feature 3.

**Prerequisit:** Spike C ha demostrat que almenys un motor millora el baseline.

**Abast:**

- Integrar a `gradeExam` seguint el trigger definit (`route !== 'text'` AND `ocr_status` adequat)
- Respectar límits operatius (timeout 30s, 0 retries, fallback a text base si error)
- Comparar veredicte del grader amb text base vs text millorat
- No canviar el comportament per defecte del grader

**Entregable:** harness que mostra, per un alumne real, si el veredicte canvia quan usa el text millorat.

---

## Criteri d'èxit de la feature

La feature estarà ben orientada si, en una mostra real de crops difícils:

- El text resultant és clarament millor que el baseline per criteri de §Definició de "millor OCR"
- Un humà pot recuperar millor la intenció tècnica (SQL, paraules clau)
- El sistema ho fa sense enviar dades a tercers
- El cost i latència són assumibles (≤30s per crop en casos reals)

No cal mesurar "nota millor" en aquesta fase. Això vindrà si la línia es consolida.

---

## Fora d'abast (Feature 4)

- Grading o judici docent
- Crida a LLM
- Comparació de models docents
- Batch amb Drive o qualsevol sistema extern
- Persistència de resultats
- Pipeline final de producció
- Tuning fi de prompts
- Visió multimodal directa (canal vision és una alternativa separada, no part d'aquesta feature)

---

## Refs

- **VIA MORTA evidència:** `docs/spikes/ocr-gate-loop/iteration-02.md`
- **Router Feature 3:** `features/answer-evaluator/services/routeQuestionForEvaluation.ts`
- **Gate semàntic:** `features/answer-evaluator/services/detectSemanticOcrQuality.ts`
- **Privadesa:** `docs/privacy/PRIVACY_ARCHITECTURE.md` §8 (respostes gràfiques / crops externs)
- **Dataset crops difícils:** `docs/spikes/ocr-gate-loop/dataset.json`
