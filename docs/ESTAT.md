# Estat del projecte (operatiu)

**Darrera actualització:** 2026-03-21

Només **estat i verificació**. Normativa: **`AGENTS_ARQUITECTURA.md`**. Ordre de lectura: **`llm.txt`**.

---

## Fase

**Foundations + govern documental** — frontend canònic `apps/frontend`, **validació canònica via Docker** (`frontend-check`), manifest `llm.txt`. **Feature 0 (template-inference):** pivot a **viabilitat de plantilla per extracció de regions de resposta** — domini `template_feasibility.schema.ts` (`AnswerRegion`: `question_id`, `page`, `bbox` normalitzat), **`validateTemplateFeasibility`**, `templateDraftNormalizer`, `llmTemplateAnalyzer`, fonts stub / **`createLlmTemplateDraftSource`** (servidor, `fetch`, sense SDK). Resposta d’èxit: **`status: 'ok' | 'ko'`**, `reasons` si `ko`, **`answer_regions`** si `ok`; camp opcional **`debug`** (`rawDraft`, `normalizedDraft`) per demo. Handlers stub / LLM + POST **`/api/feature0/analysis`** i **`/api/feature0/analysis/llm`** (**sense clau → HTTP 503**). **PDF (text embegut, sense OCR):** **`/api/feature0/analysis/pdf`** i **`/api/feature0/analysis/pdf/llm`** (multipart camp **`file`**). Client **`analyzeFeature0FromPdf`**. Demo **`/demo/feature0`**: text + pujada PDF. **Stub PDF:** si el **nom del fitxer** suggereix document de solució (`looksLikeSolutionPdfFilename`), es força draft `prompt_answer_regions_not_separable` (fail-closed per a crop); la ruta **PDF LLM** no usa aquesta heurística (el model veu el text extret). **Fixtures PDF reals** (còpia dels de `data/`): `tests/fixtures/template-inference/pdf/`. Doc històric: `feasibility-definition.md` (nota d’alineació al pivot). **Casos canònics:** `fixtures/template-inference/` + **`feature0CanonicalCases.test.ts`** + **`feature0PdfRealFixtures.test.ts`**. Sense OCR, sense crops reals sobre alumnes, sense classificació text|mixed|blank en aquesta fase.

---

## Tancat (com verificar)

| Què | Com |
|-----|-----|
| Git (flux) | Branca única **`main`**: treball i push a **`main`** (normativa: `AGENTS_ARQUITECTURA.md` §1). |
| Frontend canònic | `apps/frontend/`; `npm run dev` arrenca Vite. Demo **`/demo/feature0`**: stub + botó model (env al servidor). |
| Qualitat (canònic) | `./scripts/run_frontend.sh lint` · `typecheck` · `test` · `build` (o `./lint.sh` …) — tot dins `frontend-check` (Docker). `npm` al host només opcional per `dev`. |
| CI | `.github/workflows/ci.yml`: `docker compose run --rm frontend-check sh -c "npm ci && npm run lint && …"` (mateix contenidor que local). |
| Docker | `docker compose up --build` → servei **frontend** (nginx). Validació: servei **frontend-check** (veure `docker-compose.yml`). |
| Manifest agents | `llm.txt` (índex raw). |
| Push | Remote canònic: `git@github.com:romros/laboratori_profes.git`. Si tens **més d’una clau SSH** a GitHub (p. ex. deploy key només per aquest repo), al clon local: `git config core.sshCommand "ssh -i ~/.ssh/id_ed25519_laboratori_profes -o IdentitiesOnly=yes"` (ajusta el camí de la clau privada). Sense això, SSH pot triar una altra clau i donar *Permission denied to deploy key*. |
| Legacy | `legacy/figma-prototype/` mogut; **no oficial** (veure `llm.txt` § Legacy). |
| Feature 0 template / regions | Doc + codi | Doc: `feasibility-definition.md` (context històric) + `docs/product-context.md`. Domini: `template_feasibility.schema.ts`, `template.schema.ts` (`regionSchema`). Feature: `validateTemplateFeasibility`, plugin Vite `feature0AnalysisApiPlugin.ts`, tests unit/integration sota `tests/…/template-inference/`. |
| Verificar frontend / Feature 0 | `./scripts/run_frontend.sh test` · `typecheck` · `lint` · `build` (o `./test.sh` …); **sempre** dins `frontend-check`. Inclou casos canònics Feature 0 (`feature0CanonicalCases.test.ts`). |

---

## Falta

- **Producte** Feature 0 següent: geometria en coordenades de pàgina reals, backend fora de Vite — la lògica `ok/ko` + pipeline PDF mínim (text embegut) ja són al domini i a la demo.

---

## Següent pas

**Producte** Feature 0: coordenades reals / layout — després del flux PDF+stub/LLM actual; validació amb `./scripts/run_frontend.sh …` (Docker).
