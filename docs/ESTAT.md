# Estat del projecte (operatiu)

**Darrera actualització:** 2026-03-25

Només **estat i verificació**. Normativa: **`AGENTS_ARQUITECTURA.md`**. Ordre de lectura: **`llm.txt`**.

---

## Fase

**Foundations + govern documental** — frontend canònic `apps/frontend`, **validació canònica via Docker** (`frontend-check`), manifest `llm.txt`. **Feature 0 (template-inference):** contracte `feasibility-definition.md` + **nucli executable** (Zod, `validateTemplateDraft`, `templateDraftNormalizer`, fixtures, tests) + `llmTemplateAnalyzer` (fonts injectables, **`llmTemplateDraftSourceStub`**) + **contracte d’integració** `Feature0AnalysisRequest` / `Feature0AnalysisResponse` (`contracts/feature0AnalysisContract.ts`) i **handler stub local** `handleFeature0AnalysisStub` (`server/feature0AnalysisStubHandler.ts`, sense HTTP extern ni model real — punt on s’encaixarà futur backend). Normalizer → validator; la decisió és sempre del validator. Sense PDF, sense UI de producte.

---

## Tancat (com verificar)

| Què | Com |
|-----|-----|
| Git (flux) | Branca única **`main`**: treball i push a **`main`** (normativa: `AGENTS_ARQUITECTURA.md` §1). |
| Frontend canònic | `apps/frontend/`; `npm run dev` arrenca Vite (arrel repo). |
| Qualitat (canònic) | `./scripts/run_frontend.sh lint` · `typecheck` · `test` · `build` (o `./lint.sh` …) — tot dins `frontend-check` (Docker). `npm` al host només opcional per `dev`. |
| CI | `.github/workflows/ci.yml`: `docker compose run --rm frontend-check sh -c "npm ci && npm run lint && …"` (mateix contenidor que local). |
| Docker | `docker compose up --build` → servei **frontend** (nginx). Validació: servei **frontend-check** (veure `docker-compose.yml`). |
| Manifest agents | `llm.txt` (índex raw). |
| Push (aquest entorn) | Remote `git@github.com-laboratori:romros/laboratori_profes.git`; `ssh -T git@github.com-laboratori` OK. **Altres màquines:** calen credencials/SSH pròpies (no depèn d’aquest fitxer). |
| Legacy | `legacy/figma-prototype/` mogut; **no oficial** (veure `llm.txt` § Legacy). |
| Feasibility template-inference | Doc + codi domini | Doc: `docs/features/template-inference/feasibility-definition.md`. Codi: `src/domain/template-inference/`, `features/template-inference/contracts/`, `server/feature0AnalysisStubHandler.ts`, serveis (`validateTemplateDraft`, normalizer, fonts, `llmTemplateAnalyzer`), fixtures, tests `tests/unit/template-inference/` i `tests/integration/template-inference/`. |
| Verificar frontend / Feature 0 | `./scripts/run_frontend.sh test` · `typecheck` · `lint` · `build` (o `./test.sh` …); **sempre** dins `frontend-check`. |

---

## Falta

- **Integració** Feature 0 següent: analitzador LLM, parsing PDF, UI — només quan ho demani una tasca PM. Backend / OCR / PDF.js fora d’aquesta fase si no es demana.

---

## Següent pas

**Integració** Feature 0: analitzador LLM, parsing PDF, UI — només amb tasca PM; validació prèvia sempre amb `./scripts/run_frontend.sh …` (Docker).
