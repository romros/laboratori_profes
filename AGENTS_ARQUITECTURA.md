# AGENTS_ARQUITECTURA — normativa per agents

**Aquest fitxer és normatiu i estable.** L’estat del treball, verificacions i següents passos van a **`docs/ESTAT.md`**.

Abans de tocar codi: `docs/ESTAT.md` · `docs/architecture.md` · `docs/engineering-rules.md`.

---

## 1) Invariants del projecte

1. **Una sola base de producte:** el frontend oficial és **`apps/frontend`**. **`legacy/figma-prototype`** és històric; no hi afegeixis producte nou.
2. **Capes obligatòries** sota `apps/frontend/src/`: `app/` · `domain/` · `features/` · `infrastructure/` · `shared/`. No inventis una sisena capa sense decisió de PM.
3. **Feature 0 encara no existeix** com a implementació: cap lògica de negoci real nova fora del que ja digui una tasca explícita del PM.
4. **Els “subprojectes” del roadmap** (o workstreams) són **planificació**, no una estructura de carpetes a l’arrel del repo. Les carpetes de codi segueixen aquest monorepo i les capes d’aquest document.

---

## 2) Capes: rol i fronteres

| Capa | Rol | Prohibit |
|------|-----|----------|
| **`app/`** | Orquestració UI: composició, rutes, shell, estils globals d’app, entrada. | Lògica de negoci, regles de domini, crides directes a APIs externes si poden encapsular-se a `infrastructure/`. |
| **`domain/`** | **Únic lloc** per contractes compartits: tipus, schemas (p. ex. Zod), errors de domini reutilitzables entre features. | UI, React, `fetch`, SDKs de tercers. |
| **`features/<nom>/`** | Vertical per funcionalitat. Carpeta reservada inicial: `template-inference`, `preprocessing`, `privacy`. | Exportar “tipus de tot el món”; si és compartit entre features → `domain/`. |
| **`infrastructure/`** | Porta d’entrada a **llibreries externes**, HTTP, emmagatzematge, adaptadors. | Regles de negoci que no siguin purament tècniques (aquestes van a `domain` o `features`). |
| **`shared/`** | Helpers **sense coneixement de negoci** (format, id, utils genèriques). | Tipus o regles de producte; això és `domain/` o `features/`. |

### Direcció d’imports (resum)

- **`domain`** no importa des de `app`, `features` ni `infrastructure`.
- **`shared`** no importa des de `domain`, `features`, `app` ni `infrastructure`.
- **`infrastructure`** pot usar `domain` (tipus/DTO) i `shared`; no ha de dependre de `features` ni `app`.
- **`features`** pot usar `domain`, `infrastructure`, `shared`; no importa des d’altres `features` excepte si una tasca del PM ho defineix explícitament (per defecte: **no**).
- **`app`** pot usar `features`, `shared` i tipus de `domain` només per wiring; sense lògica de negoci.

Si un import trenca això, **atura’t** i escala al PM (o demana tasca que ho autoritzi).

---

## 3) Normes de codi (agents)

- **Abast mínim:** només els fitxers necessaris per la tasca. Sense refactors laterals ni “neteja” no sol·licitada.
- **Carpetes:** no moguis ni renombres carpetes sense necessitat documentada a la tasca o acord PM.
- **Abstraccions:** no en creïs si no hi ha un **seam** clar (límit on canviar implementació sense tocar la resta).
- **Imports:** tots a la **capçalera** del fitxer. Si algun import no pot ser-hi (cas excepcional), **comentari a la mateixa línia** que el justifiqui.
- **Zero hardcode de policy / config:** cap valor de política, URL d’API, paths mágics, noms de features com a contracte, versions de protocol o decisions de negoci dins la lògica. Usa constants centralitzades, configuració injectada, o `domain` per valors que són part del contracte — com acordi la tasca. Si no hi ha encaix clar: **PM**.
- **Contractes compartits entre features:** només a **`domain/`**. `features/` no és repositori de “tipus globals”.

---

## 4) Testing i evidència

- **Vitest.** Proves properes al codi (`*.test.ts`) o `src/__tests__/` si són transversals.
- **Cap tasca `DONE` sense evidència real:** comandes executades (p. ex. `npm run test`, `lint`, `typecheck`, `build`) i resultat bo, o motiu documentat si alguna excepció és acceptada per PM.
- **Smoke existent:** no el trenquis sense substituir cobertura equivalent acordada.

---

## 5) Spike → feature canònica

1. **Spike:** codi explícitament limitat (branca, carpeta amb nom clar `experimental/` dins la feature, o documentat a la tasca). Pot saltar-se algunes normes **només** si la tasca ho diu.
2. **Graduació:** eliminar o integrar; estructura final ha de complir aquest document; contractes a `domain/`; dependències externes darrere `infrastructure/`; proves per la part que queda.
3. No deixis “spike” sense data o sense tasca de tancament: o es converteix en producte o es retira.

---

## 6) Tancament de tasques i estats

Estats permesos (tal com marca el flux del projecte):

- **`DONE`** — criteris de la tasca complerts **i** evidència de validació adjunta o descrita (comandes, checks).
- **`IMPLEMENTED, NOT VALIDATED`** — implementat però falta validació explícita (indica què falta).
- **`BLOCKED — PM REVIEW REQUIRED`** — contradicció doc, buit de producte, decisió arquitectònica no tancada.

**No improvisis** arquitectura ni contradisquis aquests documents: documenta el problema i **escala al PM**.

---

## 7) Scripts (arrel del repo)

`npm run dev` · `build` · `test` · `lint` · `typecheck` — workspace `@profes/frontend`.
