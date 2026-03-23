# Estat del projecte (operatiu)

**Darrera actualització:** 2026-03-23 (Feature 3 definida — pendent d’implementació)

Només **estat i verificació**. Normativa: **`AGENTS_ARQUITECTURA.md`**. Ordre de lectura: **`llm.txt`**.

---

## Estat de les features

| Feature | Estat | Resum |
|---------|-------|-------|
| **Feature 0** — Template inference + layout mapping | **DONE** | Viabilitat plantilla (LLM) + mapping anchor→zones. 4 PDFs reals validats. |
| **Feature 1** — Question-answer extraction (OCR) | **DONE** | OCR + segmentació per marcadors. 4 alumnes reals. Limitació: scans de molt baixa qualitat fora d’abast. |
| **Feature 2** — Assessment Spec Builder | **DONE / CONGELADA** | Dues passades LLM (MODE OPERATIU + MODE PEDAGÒGIC) + `examDocumentContext`. Prerequisit de Feature 3. |
| **Feature 3** — Answer Evaluator | **DEFINIDA — pendent MVP** | Jutja `answer_text` vs `AssessmentSpec`. Retorna `verdict` + `feedback` + `confidence`. |

**Validació canònica:** `./scripts/run_frontend.sh lint|typecheck|test|build` (Docker `frontend-check`). 256 tests passant.

---

## Tancat (com verificar)

| Què                            | Com                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Git (flux)                     | Branca única **`main`**: treball i push a **`main`** (normativa: `AGENTS_ARQUITECTURA.md` §1).                                                                                                                                                                                                                                                                                            |
| Frontend canònic               | `apps/frontend/`; `npm run dev` arrenca Vite. Demo **`/demo/feature0`**: stub + botó model (env al servidor).                                                                                                                                                                                                                                                                             |
| Qualitat (canònic)             | `./scripts/run_frontend.sh lint` · `typecheck` · `test` · `build` (o `./lint.sh` …) — tot dins `frontend-check` (Docker). `npm` al host només opcional per `dev`.                                                                                                                                                                                                                                |
| CI                             | `.github/workflows/ci.yml`: `docker compose run --rm frontend-check sh -c "npm ci && npm run lint && …"` (mateix contenidor que local).                                                                                                                                                                                                                                                   |
| Docker                         | `docker compose up --build -d` → serveis **frontend** (nginx, ports 9088/9443) + **qae-api** (Node 22, permanent, `restart: unless-stopped`). Nginx fa **proxy invers** de `/api/…` cap a `qae-api:8787` (xarxa interna, sense ports exposats). Validació: servei **frontend-check**.                                                                                                      |
| QAE (demo)                     | `http://<IP>:9088/demo/qae` — puja PDF, tot passa pel port 9088 (nginx proxy). Sense ports extra al firewall. Vite dev local: `npm run dev:qae-api` (port 8787 al host).                                                                                                                                                                                                                  |
| Manifest agents                | `llm.txt` (índex raw).                                                                                                                                                                                                                                                                                                                                                                    |
| Push                           | Remote canònic: `git@github.com:romros/laboratori_profes.git`. Si tens **més d’una clau SSH** a GitHub (p. ex. deploy key només per aquest repo), al clon local: `git config core.sshCommand "ssh -i ~/.ssh/id_ed25519_laboratori_profes -o IdentitiesOnly=yes"` (ajusta el camí de la clau privada). Sense això, SSH pot triar una altra clau i donar _Permission denied to deploy key_. |
| Legacy                         | `legacy/figma-prototype/` mogut; **no oficial** (veure `llm.txt` § Legacy).                                                                                                                                                                                                                                                                                                               |
| Feature 0 viabilitat plantilla | Doc: `feasibility-definition.md` + `docs/product-context.md`. Domini: `template_feasibility.schema.ts`, `template.schema.ts`. Feature: `validateTemplateFeasibility`, plugin Vite `feature0AnalysisApiPlugin.ts`, tests sota `tests/…/template-inference/`.                                                                                                                               |
| Feature 0 layout mapping       | Contracte: `domain/template-mapped-answers/templateMappedAnswers.schema.ts`. Builder: `features/template-answer-zones/services/buildTemplateMappedAnswers.ts`. Components: `detectTemplateQuestionAnchors`, `verifyScanMatchesTemplate`, `deriveAnswerZonesFromAnchors`, `cleanAnswerZoneText`. Harness: `npm run spike:template-mapped-answers`. UI debug: `/debug/template`.             |
| Verificar frontend / Feature 0 | `./scripts/run_frontend.sh test` · `typecheck` · `lint` · `build` (o `./test.sh` …); **sempre** dins `frontend-check`.                                                                                                                                                                                                                                                                    |

---

## Limitacions conegudes (Feature 1 — OCR)

**Iteració OCR tancada** (3 rondes de benchmark, 2026-03-22/23). Hipòtesis provades i descartades:

| Hipòtesi | Resultat |
|----------|----------|
| Tuning Tesseract.js WASM (idioma, PSM) | ❌ no millora |
| Tesseract CLI natiu 5.5.1 | ❌ equivalent a WASM |
| Preprocessing simple (grayscale + contrast + threshold) | ❌ empitjora casos bons |

**Causa arrel:** la qualitat d’escaneig d’`ex_alumne4` (i documents similars) és insuficient per a Tesseract amb qualsevol configuració simple. El bottleneck és l’entrada, no el motor.

**Límit documentat:** documents amb escaneig de molt baixa qualitat queden **fora d’abast del MVP**. No reobrir aquesta línia sense evidència de millora real o canvi d’estratègia (preprocessament avançat, motor nou, o millora d’origen de l’escaneig).

Evidència completa: `docs/benchmarks/ocr-benchmark-2026-03-22.md`.

---

## Feature 2 — Assessment Spec Builder — **DONE** (2026-03-23)

**Construeix `AssessmentSpec` a partir de materials del professor (enunciat + solucionari). Prerequisit de Feature 3. No toca dades d’alumnes.**

### Arquitectura de les dues passades

| Passada | Servei | Rol al prompt | Comportament |
|---------|--------|---------------|--------------|
| 1 | `buildAssessmentSpec` | **MODE OPERATIU** — parser fidel | Copia el professor: extreu fidelment, zero inferència no explícita |
| 2 | `enrichAssessmentSpec` | **MODE PEDAGÒGIC** — lector docent | Pensa com el professor: interpreta model conceptual, accepta variants, no exigeix literalitat |

**Regla de `required_elements` (passada 2):** un nom de taula/columna absent de l’enunciat → `accepted_variant`, no `required_element`.

### Arquitectura final (Feature 2 congelada)

| Capa | Component | Rol | Input |
|------|-----------|-----|-------|
| Passada 1 | `buildAssessmentSpec` | MODE OPERATIU — parser fidel | `examText`, `solutionText` |
| Passada 2 | `enrichAssessmentSpec` | MODE PEDAGÒGIC — lector docent | base spec + `examText` + `solutionText` + `examDocumentContext` (opcional) |
| Context | `extractDocumentContext` | Tall determinista pre-"Es demana" | `examText` complet |

**`examDocumentContext`:** text anterior al llistat de preguntes (model relacional, restriccions globals). Suport interpretatiu per a passada 2. Guardrail: no pot generar `required_elements` no verificables. HTTP: `exam_document_context` (opcional, JSON).

### Evidència de tancament final (2026-03-23)

| Verificació | Commit | Resultat |
|-------------|--------|---------|
| Prompts MODE OPERATIU / MODE PEDAGÒGIC | `cf20c32` | ✅ |
| Tests de contracte (8 asserts prompts) | `cf20c32` | ✅ 241 tests |
| Q11 analitzat (`q11-contract-analysis.md`) | `cf20c32` | ✅ |
| Golden hospital `gpt-5.4` × 2 passades | `bbb905b`/`355a091` | ✅ |
| `extractDocumentContext` + fixture hospital real | `dc508ab` | ✅ 256 tests |
| Wiring `examDocumentContext` a passada 2 | `dc508ab` | ✅ |
| Revisió funcional estàtica (cas hospital) | 2026-03-23 | ✅ |
| Validació Docker final (`test lint typecheck`) | 2026-03-23 | ✅ |

### Declaració de congelació (Feature 2)

**Acceptat:** bugs, ajustos menors de wiring, correccions documentals.

**Tancat fins a decisió PM:** nous experiments de prompts, scoring, calibratge, criteris de nota, feedback a l'alumne, grading de qualsevol tipus.

### Feature 2 NO inclou

- Grading real de respostes d’alumnes → **Feature 3**
- Scoring / nota final → **Feature 3**
- Calibratge continu de models
- Policy de puntuació parcial
- Feedback final a l’alumne
- UI de gestió d’specs (pendent PM)
- Persistència estable per convocatòria (pendent PM)

### Refs

- **Schema:** `domain/assessment-spec/assessmentSpec.schema.ts`
- **Serveis:** `features/assessment-spec-builder/services/`
- **Endpoint HTTP:** `executeAssessmentSpecBuildFromJsonBody` (`pedagogic_enrichment: true` per pipeline complet)
- **Docs:** `docs/features/assessment-spec-builder/README.md`, `q11-contract-analysis.md`, `hospital-model-calibration-notes.md`
- **Clau API:** `ASSESSMENT_SPEC_OPENAI_API_KEY` o `OPENAI_API_KEY` o (dev) `FEATURE0_OPENAI_API_KEY`
- **Regenerar golden passada 1:** `SAVE_ASSESSMENT_SPEC_GOLDEN=1` + clau
- **Regenerar golden passada 2:** `npm run write:hospital-enriched-fixture -w @profes/frontend` + clau

---

## Feature 3 — Answer Evaluator — **DEFINIDA, pendent d'implementació**

**Avalua les respostes OCR d'un alumne contra un `AssessmentSpec` i produeix un veredicte pedagògic per pregunta.**

| Input | Font |
|-------|------|
| `AssessmentSpec` | Feature 2 (persistit) |
| `answer_text` + `ocr_status` per pregunta | Feature 0 o Feature 1 |

Output per pregunta: `evaluable_by_ocr` (`yes`\|`review`\|`no`) · `verdict` (`correct`\|`partial`\|`incorrect`\|`null`) · `feedback` · `confidence`.

**Guardrails MVP:** no score numèric; no avalua si `evaluable_by_ocr === 'no'`; dubte beneficia l'alumne; `accepted_variants` honoren `required_elements`.

**Doc complet:** `docs/features/answer-evaluator/README.md`.

---

## Falta

- **Feature 0 (coordenades físiques):** geometria en coordenades de pàgina reals (x/y bbox) — fora d'abast del MVP actual. La lògica `ok/ko` + pipeline anchor/zones/mapping ja són funcionals; les coordenades físiques requeririen un backend fora del middleware Vite i integració amb rasteritzador. No prioritat fins que PM ho demani.
- **Feature 0 (backend Capa 1):** ruta `/api/feature0/analysis` funciona via plugin Vite; en producció caldria backend Node independent. Pendent PM.
- **Feature 2 (producte):** persistència estable d’`AssessmentSpec` per convocatòria, UI de revisió (pendent PM). No bloqueja Feature 3.
- **Feature 3 (implementació):** schema `QuestionEvaluation`, servei `evaluateAnswer`, prompt jutge pedagògic, tests golden hospital.

---

## Següent pas

**Feature 0, Feature 1 i Feature 2 tancades i congelades. Feature 3 definida, pendent d'implementació.**

- **Feature 3 MVP** — `Answer Evaluator`: avalua `answer_text` per pregunta contra `AssessmentSpec`. Retorna `evaluable_by_ocr`, `verdict` (correct/partial/incorrect), `feedback`, `confidence`. Cap score numèric al MVP. Doc: `docs/features/answer-evaluator/README.md`.

Validació habitual: `./scripts/run_frontend.sh …` (Docker).
