# Estat del projecte (operatiu)

**Darrera actualització:** 2025-03-22

Només **estat i verificació**. Normativa: **`AGENTS_ARQUITECTURA.md`**. Ordre de lectura: **`llm.txt`**.

---

## Fase

**Foundations + govern documental** — frontend canònic `apps/frontend`, **validació canònica via Docker** (`frontend-check`), manifest `llm.txt`. **Feature 0 (template-inference):** pivot a **viabilitat de plantilla per extracció de regions de resposta** — domini `template_feasibility.schema.ts` (`AnswerRegion`: `question_id`, `page`, `bbox` normalitzat), **`validateTemplateFeasibility`**, `templateDraftNormalizer`, `llmTemplateAnalyzer`, fonts stub / **`createLlmTemplateDraftSource`** (servidor, `fetch`, sense SDK). Resposta d’èxit: **`status: 'ok' | 'ko'`**, `reasons` si `ko`, **`answer_regions`** si `ok`; camp opcional **`debug`** (`rawDraft`, `normalizedDraft`) per demo. Handlers stub / LLM + POST **`/api/feature0/analysis`** i **`/api/feature0/analysis/llm`** (**sense clau → HTTP 503**). Middleware només **`vite dev` / `vite preview`**. Client `analyzeFeature0` / **`analyzeFeature0WithLlm`**; demo **`/demo/feature0`**. Entrada actual: text placeholder (PDF en tasca separada). Doc històric: `feasibility-definition.md` (nota d’alineació al pivot). **Casos canònics:** `fixtures/template-inference/` + **`feature0CanonicalCases.test.ts`**. Sense OCR, sense crops reals sobre alumnes, sense classificació text|mixed|blank en aquesta fase.

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
| Feature 0 template / regions | Doc + codi | Doc: `feasibility-definition.md` (context històric) + `docs/product-context.md`. Domini: `template_feasibility.schema.ts`, `template.schema.ts` (`regionSchema`). Feature: `validateTemplateFeasibility`, plugin Vite `feature0AnalysisApiPlugin.ts`, tests unit/integration sota `tests/…/template-inference/`. |
| Verificar frontend / Feature 0 | `./scripts/run_frontend.sh test` · `typecheck` · `lint` · `build` (o `./test.sh` …); **sempre** dins `frontend-check`. Inclou casos canònics Feature 0 (`feature0CanonicalCases.test.ts`). |

---

## Falta

- **Producte** Feature 0 següent: **PDF real** de plantilla, geometria en coordenades de pàgina, backend fora de Vite — segons tasca PM (la lògica `ok/ko` + regions ja està al domini actual).

---

## Següent pas

**Producte** Feature 0: integració **PDF** + pipeline sobre el contracte `answer_regions` — amb tasca PM; validació amb `./scripts/run_frontend.sh …` (Docker).
