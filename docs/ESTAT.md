# Estat del projecte (operatiu)

**Darrera actualització:** 2026-03-26

Només **estat i verificació**. Normativa: **`AGENTS_ARQUITECTURA.md`**. Ordre de lectura: **`llm.txt`**.

---

## Fase

**Foundations + govern documental** — frontend canònic `apps/frontend`, **validació canònica via Docker** (`frontend-check`), manifest `llm.txt`. **Feature 0 (template-inference):** contracte `feasibility-definition.md` + **nucli executable** (Zod, `validateTemplateDraft`, `templateDraftNormalizer`, fixtures, tests) + `llmTemplateAnalyzer` (fonts injectables, **`llmTemplateDraftSourceStub`**) + **contracte d’integració** + **handler** `handleFeature0AnalysisStub` + **flux end-to-end demo**: POST local **`/api/feature0/analysis`** (middleware Vite, només **`vite dev` / `vite preview`**; el build estàtic / nginx **no** inclou aquesta API) + client **`analyzeFeature0`** (`client/feature0AnalysisClient.ts`) + pantalla tècnica **`/demo/feature0`** (`ui/Feature0DemoPage.tsx`). Sense backend extern, sense model real, sense PDF. La UI de demo només mostra resultats del validator.

---

## Tancat (com verificar)

| Què | Com |
|-----|-----|
| Git (flux) | Branca única **`main`**: treball i push a **`main`** (normativa: `AGENTS_ARQUITECTURA.md` §1). |
| Frontend canònic | `apps/frontend/`; `npm run dev` arrenca Vite (arrel repo). Demo Feature 0: **`/demo/feature0`** (cal dev o `vite preview`; veure POST stub a la fase). |
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

- **Integració** Feature 0 següent: analitzador LLM, parsing PDF, UI — només quan ho demani una tasca PM. Backend / OCR / PDF.js fora d’aquesta fase si no es demana.

---

## Següent pas

**Integració** Feature 0: analitzador LLM, parsing PDF, UI — només amb tasca PM; validació prèvia sempre amb `./scripts/run_frontend.sh …` (Docker).
