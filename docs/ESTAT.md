# Estat del projecte (operatiu)

**Darrera actualització:** 2026-03-24 (Feature 4 definida — OCR fallback server-side efímer)

Només **estat i verificació**. Normativa: **`AGENTS_ARQUITECTURA.md`**. Ordre de lectura: **`llm.txt`**.

---

## Estat de les features

| Feature | Estat | Resum |
|---------|-------|-------|
| **Feature 0** — Template inference + layout mapping | **DONE** | Viabilitat plantilla (LLM) + mapping anchor→zones. 4 PDFs reals validats. |
| **Feature 1** — Question-answer extraction (OCR) | **DONE** | OCR + segmentació per marcadors. 4 alumnes reals. Limitació: scans de molt baixa qualitat fora d’abast. |
| **Feature 2** — Assessment Spec Builder | **DONE / CONGELADA** | Dues passades LLM (MODE OPERATIU + MODE PEDAGÒGIC) + `examDocumentContext`. Prerequisit de Feature 3. |
| **Feature 3** — Answer Evaluator | **MVP implementat — VIA MORTA gate (iter 2/4)** | Router + gate semàntic. 327 tests. Gate pre-LLM no arriba a precision ≥ 70%. Pròxim: Feature 4. |
| **Feature 4** — OCR Fallback Server-side | **DEFINICIÓ + Spike B0 definit** | Servei Python Docker separat, efímer, privacy-first. Spike B0 (preprocessing mínim) definit i harness implementat. Pendent: execució + validació manual. |

**Validació canònica:** `./scripts/run_frontend.sh lint|typecheck|test|build` (Docker `frontend-check`). 327 tests passant.

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

## Feature 3 — Answer Evaluator — **MVP implementat — loop validació OCR gate**

**Avalua les respostes OCR d’un alumne contra un `AssessmentSpec` i produeix un veredicte pedagògic per pregunta.**

### Arquitectura MVP (2026-03-24)

| Component | Fitxer | Rol |
|-----------|--------|-----|
| Schema | `domain/answer-evaluator/answerEvaluator.schema.ts` | Types Zod: `AnswerForEvaluation`, `QuestionEvaluation`, `ExamEvaluationResult` |
| Gate semàntic | `features/answer-evaluator/services/detectSemanticOcrQuality.ts` | Detecció gibberish domain-agnostic |
| Router pre-LLM | `features/answer-evaluator/services/routeQuestionForEvaluation.ts` | Decideix `text\|vision\|skip` |
| Prompt jutge | `features/answer-evaluator/services/evaluateAnswerPrompt.ts` | MODE PROFESSOR + CONTEXT OCR + GUARDRAIL |
| Servei | `features/answer-evaluator/services/evaluateAnswer.ts` | 1 LLM call per pregunta |
| Orquestrador | `features/answer-evaluator/services/gradeExam.ts` | Pipeline complet per examen |

### Evidència MVP + router + gate

| Verificació | Commit | Resultat |
|-------------|--------|---------|
| Schema + prompt + serveis + tests | `dcbe7a8` | ✅ |
| Router integrat a `gradeExam` | Spike 3.C | ✅ |
| Gate semàntic (`detectSemanticOcrQuality`) | Feature 0.4 | ✅ 7/36 falsos ok eliminats |
| Gate domain-agnostic (`hasTechnicalSignal`) | `0c9f570` | ✅ 327 tests |
| Spike 3.D (validació canal text) | `spike-3d-...md` | ⚠ 33% concordança — loop actiu |

### Loop de validació OCR gate — **VIA MORTA** (2026-03-24)

**Objectiu:** determinar si el gate pot separar amb fiabilitat raonable `text` de `skip`.

**Resultat:** VIA MORTA declarada a iteració 2/4.

| Iteració | Precision | FP rate | Resultat |
|----------|-----------|---------|---------|
| 1 | 30.6% | 69.4% | Baseline — skip=0, tot va a text |
| 2 | ~33% (simulat) | ~67% | Cap heurística funciona — distributions TP≈FP |

**Causa arrel:** el QAE upstream etiqueta `ok` textos semànticament il·legibles.
Cap comptador de tokens (plausibleRatio, sql_signals, gibberish, noise) pot
discriminar "CREATE TABLE amb camps llegibles" de "CREATE TABLE amb camps corromputs"
sense comprensió semàntica.

**Decisió:** no invertir més en heurístiques pre-LLM. Pròxim pas: OCR server-side o vision.

Evidència completa: `docs/spikes/ocr-gate-loop/`

### Feature 3 NO inclou (MVP)

- Score numèric per pregunta ni nota global → Feature 3.x
- Feedback directe a l’alumne (el feedback és per al professor)
- Batch massiu d’alumnes (un alumne per crida)
- Persistència de resultats

**Doc complet:** `docs/features/answer-evaluator/README.md`.

---

## Falta

- **Feature 0 (coordenades físiques):** geometria en coordenades de pàgina reals (x/y bbox) — fora d’abast del MVP actual. No prioritat fins que PM ho demani.
- **Feature 0 (backend Capa 1):** ruta `/api/feature0/analysis` funciona via plugin Vite; en producció caldria backend Node independent. Pendent PM.
- **Feature 2 (producte):** persistència estable d’`AssessmentSpec` per convocatòria, UI de revisió (pendent PM). No bloqueja Feature 3.
- **Feature 3 (pròxim pas):** VIA MORTA gate pre-LLM → Feature 4 (OCR fallback server-side). Evidència: `docs/spikes/ocr-gate-loop/`.
- **Feature 4 (pròxim pas):** DEFINICIÓ tancada. Spike B1 bloquejat per dependència circular (veure `docs/spikes/feature4/spike-b1-crop-ocr-benchmark.md`). **Pendent decisió PM** sobre origen del crop.

---

## Feature 4 — OCR Fallback Server-side — **DEFINICIÓ**

**Servei Python Docker separat, efímer i privacy-first, que millora l'OCR en origen per crops difícils.**

- **Doc:** `docs/features/ocr-fallback/README.md`
- **Motivació:** VIA MORTA del gate pre-LLM de Feature 3 — el text OCR base és massa sorollós per al grader textual
- **Arquitectura:** Python + FastAPI + Docker separat — no al `qae-api`
- **Pla:** Spike A (contracte) → Spike B (comparació engines) → Spike C (validació manual) → Spike D (wiring)
- **Decisió pendent:** quin motor OCR guanya (Kraken vs PaddleOCR vs altres) — es decideix a Spike B+C

---

## Següent pas

**Feature 0, 1, 2 tancades. Feature 3 MVP funcional. Feature 4: DEFINICIÓ tancada.**

- **Spike B0:** harness implementat, pendent d'execució i validació manual.
- **Spike B1 (engine-agnostic, pàgina sencera):** ✅ **TANCAT** — PaddleOCR 3.x 0/39 deteccions, Tesseract baseline 5/13. Ambdós insuficients per a text manuscrit. Documentat a `docs/spikes/feature4/spike-b1-engine-agnostic-benchmark.md`.
- **Spike B1 (crop-based):** ⚠️ **BLOQUEJAT** — dependència circular. Documentat a `docs/spikes/feature4/spike-b1-crop-ocr-benchmark.md`.
- **Spike 4A (PaddleOCR-VL-1.5, transformers, CPU):** ⚠️ **VIA MORTA** — inferència >8h per pàgina. Documentat a `docs/spikes/feature4/paddleocr-vl-spike-a.md`.
- **Spike VL-GGUF (PaddleOCR-VL-1.5 via llama.cpp, CPU):** ✅ **TANCAT** — **9/13 deteccions** (vs 5/13 Tesseract, +80%). Prompt `OCR:` + `repeat_penalty=1.15` + 200dpi. ~15s/pàgina. Errors residuals atribuïts a lletra manuscrita ambigua (no escàner). Documentat a `docs/spikes/feature4/spike-vl-gguf.md`.
- **Decisions pendents (PM):**
  1. Llindar qualitat: 9/13 és suficient per activar Feature 3, o cal millorar (Qwen2.5-VL-2B, CER ~3.8% vs 5.8%)?
  2. Origen del crop: pàgina sencera (actual) vs franja proporcional vs coords template (`spike-b1-crop-ocr-benchmark.md §BLOQUEIG`)
  3. Nivell scrubbing PII: fort (tot PII) vs dèbil (només DNI+telèfon) — veure `spike-vl-gguf.md §Estratègia privacitat`
- **Arquitectura privacitat dissenyada:** rasterització en memòria (browser) → base64 → servei local → scrubbing PII pre-retorn. Cap dada d'alumne a disc ni a serveis externs.
- **Evidència VIA MORTA Feature 3:** `docs/spikes/ocr-gate-loop/iteration-02.md`.

Validació habitual: `./scripts/run_frontend.sh …` (Docker).
