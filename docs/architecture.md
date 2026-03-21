# Arquitectura

## Visió general

- **Monorepo** amb workspace npm; únic frontend de producte: **`apps/frontend`**.
- **Separació de capes** sota `apps/frontend/src/`:
  - **`app`:** shell, rutes (quan n’hi hagi), muntatge de la UI. Cap regles de negoci.
  - **`domain`:** contractes i validació compartida (p. ex. Zod).
  - **`features`:** mòduls per vertical (carpetes reservades: `template-inference`, `preprocessing`, `privacy`).
  - **`infrastructure`:** integracions externes i detalls d’E/S.
  - **`shared`:** helpers genèrics.

## Fora de l’oficial

- **`legacy/figma-prototype`:** export històric; no s’hi afegeix producte nou.

## Desplegament

- Imatge Docker construïda des de l’arrel del repo (veure `apps/frontend/Dockerfile` i `docker-compose.yml`).
