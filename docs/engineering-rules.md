# Regles d’enginyeria

1. **TypeScript strict** al frontend; errors de tipus es resolen, no s’amaguen amb `any` sense motiu.
2. **ESLint + Prettier** formen part del flux (`npm run lint` inclou comprovació de format).
3. **Tests:** Vitest; afegir proves per la lògica que introdueixis (smoke mínim ja present).
4. **Imports:** respectar capes (veure `AGENTS_ARQUITECTURA.md`); evitar cicles `app` → `features` mal definits.
5. **Dependències noves:** preferir versions amb manteniment actiu; justificar si són pesades.
6. **CI ha de passar** abans de considerar una tasca tancada.
