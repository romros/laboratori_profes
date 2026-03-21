# Estat del projecte (operatiu)

**Darrera actualització:** 2026-03-21

Només **estat i verificació**. Normativa: **`AGENTS_ARQUITECTURA.md`**. Ordre de lectura: **`llm.txt`**.

---

## Fase

**Foundations + govern documental** — frontend canònic `apps/frontend`, CI, Docker, manifest `llm.txt`. **Contracte de feasibility** (template-inference) definit en doc; **implementació Feature 0** encara no iniciada.

---

## Tancat (com verificar)

| Què | Com |
|-----|-----|
| Frontend canònic | `apps/frontend/`; `npm run dev` arrenca Vite (arrel repo). |
| Qualitat | `npm ci` (o `npm install`) → `npm run lint` · `typecheck` · `test` · `build`. |
| CI | `.github/workflows/ci.yml` (mateixes comandes). |
| Docker | `docker compose build` (context arrel, veure `docker-compose.yml`). |
| Manifest agents | `llm.txt` (índex raw). |
| Push (aquest entorn) | Remote `git@github.com-laboratori:romros/laboratori_profes.git`; `ssh -T git@github.com-laboratori` OK. **Altres màquines:** calen credencials/SSH pròpies (no depèn d’aquest fitxer). |
| Legacy | `legacy/figma-prototype/` mogut; **no oficial** (veure `llm.txt` § Legacy). |
| Feasibility template-inference | Fet (només doc) | Llegir `docs/features/template-inference/feasibility-definition.md`; coherent amb fail-closed i categories `apte` / `apte_amb_limitacions` / `no_apte`. |

---

## Falta

- **Codi i schemas** Feature 0 (template-inference): validators, domini, integració segons tasca PM. Backend / OCR / PDF.js (fora d’aquesta fase si no es demana).

---

## Següent pas

Tasca d’**implementació Feature 0** (schemas, validator, flux) alineada amb el contracte de feasibility. Sense lògica de producte nova salvo tasca escrita.
