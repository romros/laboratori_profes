# Arquitectura (resum)

**Normativa** (invariants, fronteres, imports, hardcode, DoD): **`AGENTS_ARQUITECTURA.md`**.

- Monorepo npm; producte: **`apps/frontend`**.
- Capes sota `src/`: `app` · `domain` · `features` (`template-inference`, `preprocessing`, `privacy`) · `infrastructure` · `shared`.
- **`legacy/figma-prototype`:** no oficial, només referència; no estendre producte aquí.
- Docker: build des de l’arrel (`apps/frontend/Dockerfile`, `docker-compose.yml`).
