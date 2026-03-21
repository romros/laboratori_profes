# Estat del projecte (operatiu)

**Darrera actualització:** 2026-03-21

**Normativa arquitectònica:** `AGENTS_ARQUITECTURA.md` (invariants, capes, imports, DoD). **Aquest fitxer** resumeix què està fet, com ho verifiques i què ve després.

---

## Fase actual

**Foundations + governança d’agents** — repo canònic, frontend a `apps/frontend`, CI, Docker, documentació normativa reforçada. **Feature 0 no iniciada** (sense lògica de producte acordada).

---

## Què està tancat

| Àmbit | Estat | Evidència / com verificar-ho |
|--------|--------|------------------------------|
| Monorepo + frontend canònic | Fet | `apps/frontend/` existeix; `npm run dev` arrenca Vite. |
| Tooling | Fet | Des de l’arrel: `npm ci` (o `npm install`), després `npm run lint`, `typecheck`, `test`, `build`. |
| CI | Fet | Workflow `.github/workflows/ci.yml` (lint, typecheck, test, build). |
| Docker | Fet | `docker compose build` amb context arrel (veure `docker-compose.yml`). |
| Prototip no oficial | Mogut | `legacy/figma-prototype/` (no és el producte oficial). |
| Plantilla de tasques | Fet | `docs/plantilla_tasca.md`. |
| Push GitHub | Fet | Remote `git@github.com-laboratori:romros/laboratori_profes.git`; `ssh -T git@github.com-laboratori` → missatge d’èxit GitHub. |
| Governança agents | Fet | `AGENTS_ARQUITECTURA.md` normatiu; aquest `ESTAT.md` alineat. |

---

## Què falta (alt nivell)

- **Feature 0** (definició + implementació quan el PM obri la tasca).
- Backend, OCR, PDF.js, schemas de negoci reals (fora d’aquesta fase).

---

## Següent pas recomanat

1. Obrir tasca de **Feature 0** amb abast i criteris DoD explícits (respectant `AGENTS_ARQUITECTURA.md`).
2. Fins llavors: **no** afegir lògica de producte al frontend excepte tasques escrites que ho autoritzin.

---

## Històric curt (tasques grans)

- **Foundations:** DONE — validació amb `npm ci` / `lint` / `typecheck` / `test` / `build` (en entorns sense `npm` local s’ha validat amb imatge `node:22-alpine`).
