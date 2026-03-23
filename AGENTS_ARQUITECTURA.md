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
3. **Feature 0 (template-inference)** és **viabilitat de plantilla per extracció de regions de resposta** (`status: ok|ko`, `answer_regions`); schemas + validator pur + tests (veure `docs/ESTAT.md`, domini `template_feasibility.schema.ts`). No afegeixis OCR, crops d’alumnes ni classificació de respostes fora de tasca PM; fail-closed al validator.
4. **Roadmap / “subprojectes”** són **planificació**, no carpetes d’arrel alternatives. El codi viu en aquest monorepo i aquestes capes.
5. **Git — branca única:** el treball i la integració són sobre **`main`**. No s’utilitzen branques de feature com a flux per defecte; tot el que es valida i es publica ha d’acabar a **`main`** (evita desajustos entre “fet” i remot). Dubte o excepció → **PM**.

---

## 2) Capes: rol i fronteres

| Capa | Rol | Prohibit |
|------|-----|----------|
| **`app/`** | Orquestració UI: composició, rutes, shell, estils globals d’app, entrada. | Lògica de negoci, regles de domini, crides directes a APIs externes si poden anar a `infrastructure/`. |
| **`domain/`** | **Únic lloc** per contractes compartits: tipus, schemas (p. ex. Zod), errors de domini reutilitzables entre features. | UI, React, `fetch`, SDKs de tercers. |
| **`features/<nom>/`** | Vertical per funcionalitat. Reserves inicials: `template-inference`, `question-answer-extraction` (examen alumne, OCR; veure `docs/features/question-answer-extraction/`), `preprocessing`, `privacy`. | “Tipus globals”; si és compartit entre features → `domain/`. |
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
- **`DONE`** només amb evidència **dins Docker** (`./scripts/run_frontend.sh test|lint|typecheck|build`) o excepció documentada amb PM.
- No trenquis el smoke sense cobertura equivalent acordada.

---

## 5) Spike → feature canònica

Spike aïllat (`experimental/` o abast mínim reversible a **`main`**); sense branques paral·leles com a norma. Graduació = complir aquest document, contractes a `domain/`, externs a `infrastructure/`, proves. Sense spike orfe.

---

## 6) Tancament i escalat

- **`DONE`** / **`IMPLEMENTED, NOT VALIDATED`** / **`BLOCKED — PM REVIEW REQUIRED`** segons el flux del projecte.
- Contradicció o buit arquitectònic → **no improvisis**; documenta i **PM**.

---

## 8) Privadesa — guardrail permanent

Aquest producte és **privacy-first, local-first** (versió professor/autònom). És un requisit no negociable.

**Qualsevol tasca que toqui qualsevol d'aquestes àrees ha de llegir primer:**
- `docs/privacy/PRIVACY_ARCHITECTURE.md` — model, prohibicions, excepcions
- `docs/privacy/SELF_AUDIT.md` — checklist de controls

**Àrees que requereixen revisió de privadesa:**
- OCR (motors, configuració, inputs)
- Servidor / endpoints HTTP
- Uploads de fitxers
- Logs i diagnòstics
- Persistència de qualsevol forma
- Connectors o integracions externes

**Prohibit sense decisió explícita de PM:**
- Enviar PDFs o imatges d'alumnes a serveis externs
- Guardar text OCR d'exàmens al disc de forma persistent
- Afegir qualsevol servei extern que rebi dades d'alumnes
- Enviar crops o imatges per respostes **textuals** (mai, cap excepció)

**Diferenciació textual vs gràfic (contracte de privadesa):**
- Respostes textuals → local sempre, mai imatge externa
- Respostes gràfiques → pot requerir crop en futur, **únicament** amb condicions estrictes documentades a `PRIVACY_ARCHITECTURE.md §8`
- Hook existent: `isGraphicalAnswer(question)` a `template-answer-zones/isGraphicalAnswer.ts`
- Qualsevol implementació del flux gràfic requereix PM + actualització de `SELF_AUDIT.md`

**En tancar una feature que toqui les àrees anteriors:** regenerar `docs/privacy/PRIVACY_REPORT.md` (`npm run privacy:report`) i actualitzar els controls manuals a `SELF_AUDIT.md`.

---

## 7) Scripts i validació (arrel)

- **Desenvolupament (opcional al host):** `npm run dev` — workspace `@profes/frontend`.
- **Validació oficial del frontend (obligatòria per tancar tasques):** dins **Docker**, no com a font de veritat el `npm` del host:
  - `./scripts/run_frontend.sh test|typecheck|lint|build`
  - o `./test.sh` · `./typecheck.sh` · `./lint.sh` · `./build.sh` (mateix contenidor `frontend-check`, Node 22).

Cap tasca de frontend **`DONE`** sense haver passat les quatre comandes dins el contenidor (o excepció escrita amb PM). La CI usa el mateix servei `frontend-check`.
