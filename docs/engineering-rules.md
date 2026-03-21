# Regles d’enginyeria

Complements **no duplicats** respecte a `AGENTS_ARQUITECTURA.md` (capes, imports, policy, DoD → allà).

1. **TypeScript strict** al frontend; sense `any` sense motiu.
2. **ESLint + Prettier** via `npm run lint` al workspace frontend.
3. **Tests:** Vitest; cobreix la lògica que afegeixis; el smoke existent ha de passar.
4. **Dependències noves:** només si la tasca ho demana; versions mantingudes; justificar pes.
5. **CI** ha de passar abans de **`DONE`** (salvo excepció amb PM).
