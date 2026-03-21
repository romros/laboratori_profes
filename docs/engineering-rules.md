# Regles d’enginyeria

Complementen la **normativa obligatòria** d’`AGENTS_ARQUITECTURA.md` (capes, imports, policy, tancament de tasques).

1. **TypeScript strict** al frontend; errors de tipus es resolen, no s’amaguen amb `any` sense motiu.
2. **ESLint + Prettier** formen part del flux (`npm run lint` al workspace frontend).
3. **Tests:** Vitest; afegeix proves per la lògica que introdueixis. El smoke mínim existent ha de continuar passant.
4. **Capes i imports:** segueix la taula i la direcció d’imports d’`AGENTS_ARQUITECTURA.md`; evita cicles i dependències `features` ↔ `features` sense tasca explícita.
5. **Dependències noves:** només si la tasca ho demana; versions amb manteniment actiu; justificar si són pesades.
6. **CI:** ha de poder passar abans de declarar **`DONE`** (salvo excepció documentada amb PM).
