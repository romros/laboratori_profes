# Estat del projecte

**Darrera actualització:** 2025-03-21

## Fase actual

**Foundations** — repo canònic inicialitzat: frontend oficial a `apps/frontend`, documentació mínima, CI, capes `app` / `domain` / `features` / `infrastructure` / `shared`.

## Què està fet

- Monorepo npm (`apps/*`); frontend Vite + React + TypeScript.
- Zod, Vitest, ESLint, Prettier; scripts `dev`, `build`, `test`, `lint`, `typecheck`.
- GitHub Actions: lint, typecheck, test, build.
- Docker Compose apunta al build del monorepo (`apps/frontend`).
- Prototip Figma anterior mogut a `legacy/figma-prototype` (no oficial).

## Què no està fet encara

- Feature 0 i qualsevol lògica de producte real.
- Backend, OCR, PDF.js, schemas de negoci reals.

## Estat de la tasca «foundations»

**DONE** — validat localment: `npm ci`, `lint`, `typecheck`, `test`, `build`; `vite` arrenca.
