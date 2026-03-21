# Estat del projecte (operatiu)

**Darrera actualització:** 2026-03-27

Només **estat i verificació**. Normativa: **`AGENTS_ARQUITECTURA.md`**. Ordre de lectura: **`llm.txt`**.

---

## Fase

**Foundations + govern documental** — frontend canònic `apps/frontend`, **validació canònica via Docker** (`frontend-check`), manifest `llm.txt`. **Feature 0 (template-inference):** contracte `feasibility-definition.md` + **nucli executable** (Zod, `validateTemplateDraft`, `templateDraftNormalizer`, fixtures, tests) + `llmTemplateAnalyzer` (fonts: stub determinista, **`createLlmTemplateDraftSource`** amb crida **servidor** a API compatible OpenAI via `fetch`, sense SDK) + **contracte** + handlers stub / **LLM** (`handleFeature0AnalysisStub`, `handleFeature0AnalysisLlm`) + POST **`/api/feature0/analysis`** (stub) i **`/api/feature0/analysis/llm`** (model; **sense clau → HTTP 503**). Tot el middleware només en **`vite dev` / `vite preview`** (nginx build estàtic sense aquestes APIs). Client `analyzeFeature0` / **`analyzeFeature0WithLlm`**; demo **`/demo/feature0`**. Config: veure **`.env.example`** (`FEATURE0_OPENAI_API_KEY` o `OPENAI_API_KEY`, etc.). Integració inicial, **no** robusta per producció; cap crida al model des del navegador. Sense PDF.

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
| Push (aquest entorn) | Remote `git@github.com-laboratori:romros/laboratori_profes.git`; `ssh -T git@github.com-laboratori` OK. **Altres màquines:** calen credencials/SSH pròpies (no depèn d’aquest fitxer). |
| Legacy | `legacy/figma-prototype/` mogut; **no oficial** (veure `llm.txt` § Legacy). |
| Feasibility template-inference | Doc + codi domini | Doc: `docs/features/template-inference/feasibility-definition.md`. Codi: `src/domain/template-inference/`, `features/template-inference/` (contracts, `server/`, `client/`, `ui/`, serveis), plugin Vite `vite-plugins/feature0AnalysisApiPlugin.ts`, `vitest.config.ts` (tests sense carregar el plugin), tests `tests/unit/…` i `tests/integration/…`. |
| Verificar frontend / Feature 0 | `./scripts/run_frontend.sh test` · `typecheck` · `lint` · `build` (o `./test.sh` …); **sempre** dins `frontend-check`. |

---

## Falta

- **Producte** Feature 0 següent: parsing PDF, OCR, UI final, backend dedicat fora del middleware Vite — segons tasca PM.

---

## Següent pas

**Producte** Feature 0: PDF / flux complet — amb tasca PM; validació amb `./scripts/run_frontend.sh …` (Docker).
