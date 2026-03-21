# Estat del projecte (operatiu)

**Darrera actualització:** 2026-03-17

Només **estat i verificació**. Normativa: **`AGENTS_ARQUITECTURA.md`**. Ordre de lectura: **`llm.txt`**.

---

## Fase

**Foundations + govern documental** — frontend canònic `apps/frontend`, **validació canònica via Docker** (`frontend-check`), manifest `llm.txt`. **Feature 0 (template-inference):** contracte `feasibility-definition.md` + **nucli executable** (Zod `exam_feasibility` / `template` + `validateTemplateDraft` pur + fixtures + tests sota `tests/unit/template-inference/`); sense LLM, sense PDF, sense UI.

---

## Tancat (com verificar)

| Què | Com |
|-----|-----|
| Frontend canònic | `apps/frontend/`; `npm run dev` arrenca Vite (arrel repo). |
| Qualitat (canònic) | `./scripts/run_frontend.sh lint` · `typecheck` · `test` · `build` (o `./lint.sh` …) — tot dins `frontend-check` (Docker). `npm` al host només opcional per `dev`. |
| CI | `.github/workflows/ci.yml`: `docker compose run --rm frontend-check sh -c "npm ci && npm run lint && …"` (mateix contenidor que local). |
| Docker | `docker compose up --build` → servei **frontend** (nginx). Validació: servei **frontend-check** (veure `docker-compose.yml`). |
| Manifest agents | `llm.txt` (índex raw). |
| Push (aquest entorn) | Remote `git@github.com-laboratori:romros/laboratori_profes.git`; `ssh -T git@github.com-laboratori` OK. **Altres màquines:** calen credencials/SSH pròpies (no depèn d’aquest fitxer). |
| Legacy | `legacy/figma-prototype/` mogut; **no oficial** (veure `llm.txt` § Legacy). |
| Feasibility template-inference | Doc + codi domini | Doc: `docs/features/template-inference/feasibility-definition.md`. Codi: `src/domain/template-inference/` (schemas, constants), `src/features/template-inference/services/validateTemplateDraft.ts`, fixtures `fixtures/template-inference/`, tests `tests/unit/template-inference/`. |
| Verificar frontend / Feature 0 | `./scripts/run_frontend.sh test` · `typecheck` · `lint` · `build` (o `./test.sh` …); **sempre** dins `frontend-check`. |

---

## Falta

- **Integració** Feature 0 següent: analitzador LLM, parsing PDF, UI — només quan ho demani una tasca PM. Backend / OCR / PDF.js fora d’aquesta fase si no es demana.

---

## Següent pas

**Integració** Feature 0: analitzador LLM, parsing PDF, UI — només amb tasca PM; validació prèvia sempre amb `./scripts/run_frontend.sh …` (Docker).
