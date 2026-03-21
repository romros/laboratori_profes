# AGENTS_ARQUITECTURA — normativa per agents

**Font normativa única** per invariants, capes, imports, policy i tancament de tasques.

- **Ordre de lectura:** `llm.txt` (índex jeràrquic amb URLs raw).
- **Estat operatiu** (què està fet, com verificar, següent pas): **`docs/ESTAT.md`** — no duplica arquitectura.
- **Mapa del disseny** (resum): `docs/architecture.md`.
- **Eina i qualitat** (TS, ESLint, dependències): `docs/engineering-rules.md` — no repetir aquí les regles que ja hi consten.

---

## 1) Invariants del projecte

1. **Una sola base de producte:** el frontend oficial és **`apps/frontend`**. **`legacy/figma-prototype`** és històric i **no oficial**; no hi afegeixis producte ni en copiïs patrons cap al canònic.
2. **Capes obligatòries** sota `apps/frontend/src/`: `app/` · `domain/` · `features/` · `infrastructure/` · `shared/`. No inventis una sisena capa sense decisió de PM.
3. **Feature 0 encara no existeix** com a implementació: cap lògica de negoci real nova fora del que digui una tasca explícita del PM.
4. **Roadmap / “subprojectes”** són **planificació**, no carpetes d’arrel alternatives. El codi viu en aquest monorepo i aquestes capes.

---

## 2) Capes: rol i fronteres

| Capa | Rol | Prohibit |
|------|-----|----------|
| **`app/`** | Orquestració UI: composició, rutes, shell, estils globals d’app, entrada. | Lògica de negoci, regles de domini, crides directes a APIs externes si poden anar a `infrastructure/`. |
| **`domain/`** | **Únic lloc** per contractes compartits: tipus, schemas (p. ex. Zod), errors de domini reutilitzables entre features. | UI, React, `fetch`, SDKs de tercers. |
| **`features/<nom>/`** | Vertical per funcionalitat. Reserves inicials: `template-inference`, `preprocessing`, `privacy`. | “Tipus globals”; si és compartit entre features → `domain/`. |
| **`infrastructure/`** | **Porta d’entrada** a llibreries externes, HTTP, emmagatzematge, adaptadors. | Regles de negoci no purament tècniques → `domain` o `features`. |
| **`shared/`** | Helpers **sense negoci** (format, id, utils). | Tipus o regles de producte → `domain/` o `features/`. |

### Direcció d’imports

- **`domain`** no importa des de `app`, `features` ni `infrastructure`.
- **`shared`** no importa des de `domain`, `features`, `app` ni `infrastructure`.
- **`infrastructure`** pot usar `domain` i `shared`; no ha de dependre de `features` ni `app`.
- **`features`** pot usar `domain`, `infrastructure`, `shared`; **per defecte** no importa d’altres `features` (salvo tasca PM).
- **`app`** pot usar `features`, `shared` i tipus de `domain` només per wiring; sense lògica de negoci.

Import il·legítim → **atura’t** i escala al PM.

---

## 3) Normes de codi (agents)

- **Abast mínim**; sense refactors laterals ni neteja no sol·licitada.
- **Carpetes:** no moguis ni renombres sense tasca o PM.
- **Abstraccions:** només amb **seam** clar.
- **Imports:** a la **capçalera**; excepció amb **comentari a la mateixa línia**.
- **Zero hardcode de policy/config** (URLs, paths, versions de contracte, decisions de negoci a la lògica). Constants/config/`domain` segons tasca; dubte → **PM**.
- **Contractes compartits** només a **`domain/`**.

---

## 4) Testing i evidència

- **Vitest**; `*.test.ts` o `src/__tests__/`.
- **`DONE`** només amb evidència (p. ex. `test`, `lint`, `typecheck`, `build`) o excepció documentada amb PM.
- No trenquis el smoke sense cobertura equivalent acordada.

---

## 5) Spike → feature canònica

Spike aïllat (branca / `experimental/` / tasca); graduació = complir aquest document, contractes a `domain/`, externs a `infrastructure/`, proves. Sense spike orfe.

---

## 6) Tancament i escalat

- **`DONE`** / **`IMPLEMENTED, NOT VALIDATED`** / **`BLOCKED — PM REVIEW REQUIRED`** segons el flux del projecte.
- Contradicció o buit arquitectònic → **no improvisis**; documenta i **PM**.

---

## 7) Scripts (arrel)

`npm run dev` · `build` · `test` · `lint` · `typecheck` — workspace `@profes/frontend`.
