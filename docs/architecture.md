# Arquitectura

Resum estable del disseny. **Normativa detallada (imports, hardcode, DoD, escalat PM):** `AGENTS_ARQUITECTURA.md`.

## Visió general

- **Monorepo** amb workspace npm; únic frontend de producte: **`apps/frontend`**.
- **Separació de capes** sota `apps/frontend/src/`:
  - **`app`:** shell, rutes (quan n’hi hagi), muntatge de la UI. Sense lògica de negoci.
  - **`domain`:** contractes i validació compartida entre features (p. ex. Zod). Res d’UI ni d’SDKs externs.
  - **`features`:** verticals; carpetes reservades inicials: `template-inference`, `preprocessing`, `privacy` (noms de roadmap ≠ noves carpetes a l’arrel del repo).
  - **`infrastructure`:** integracions externes i E/S; porta d’entrada a llibreries de tercers.
  - **`shared`:** helpers genèrics sense negoci.

## Fora de l’oficial

- **`legacy/figma-prototype`:** export històric; no s’hi afegeix producte nou.

## Desplegament

- Imatge Docker construïda des de l’arrel del repo (`apps/frontend/Dockerfile`, `docker-compose.yml`).
