# Guia ràpida per agents (arquitectura)

Llegeix també `docs/ESTAT.md`, `docs/architecture.md` i `docs/engineering-rules.md` abans de canviar codi.

## On va cada cosa (`apps/frontend/src/`)

| Carpeta | Propòsit |
|--------|-----------|
| `app/` | Composició de la UI, entrada (`main.tsx` pot importar des d’aquí), estils globals de l’app. **Sense lògica de negoci.** |
| `domain/` | Contractes, tipus i schemas de domini (p. ex. Zod) compartits entre features. Res d’UI ni d’HTTP. |
| `features/` | Funcionalitat vertical per àrea (`template-inference`, `preprocessing`, `privacy`, …). Pot usar `domain` i `infrastructure`. |
| `infrastructure/` | Adaptadors: API, emmagatzematge, SDKs externs. La resta del codi no importa llibreries externes directament si poden anar aquí. |
| `shared/` | Utilitats genèriques sense coneixement de negoci (format, helpers). |

## Regles ràpides

1. Una sola base de codi de producte; el frontend oficial és **`apps/frontend`**. `legacy/figma-prototype` és històric, no oficial.
2. No posis lògica de negoci dins `app/`.
3. Dependències externes (OCR, PDF, etc.) → preferentment `infrastructure/`.
4. Els tests unitaris col·loca’ls a prop del codi (`*.test.ts`) o sota `src/__tests__/` si són transversals.

## Scripts (arrel del repo)

`npm run dev` · `build` · `test` · `lint` · `typecheck` — deleguen al workspace `@profes/frontend`.
