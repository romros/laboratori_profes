# Estat del projecte (operatiu)

**Darrera actualització:** 2026-03-21

Només **estat i verificació**. Normativa: **`AGENTS_ARQUITECTURA.md`**. Ordre de lectura: **`llm.txt`**.

---

## Fase

**Foundations + govern documental** — frontend canònic `apps/frontend`, CI, Docker, manifest `llm.txt`. **Feature 0 no iniciada.**

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

---

## Falta

- Feature 0 (tasca PM). Backend / OCR / PDF.js / schemas de negoci (fora d’aquesta fase).

---

## Següent pas

Tasca **Feature 0** amb abast i DoD explícits. Fins llavors: sense lògica de producte nova salvo tasca escrita.
