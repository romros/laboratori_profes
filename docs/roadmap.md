# Roadmap (esquelet)

Ordre orientatiu; les dates i el detall els fixa el PM. Normativa tècnica i lectura: `llm.txt`, `AGENTS_ARQUITECTURA.md`.

1. **Foundations** (fet): repo, frontend canònic buit, docs, CI, Docker.
2. **Feature 0** (en curs, pivot aplicat): **viabilitat de plantilla per regions de resposta** — `validateTemplateFeasibility`, contracte `ok|ko` + `answer_regions`, stub + ruta LLM local (Vite), demo `/demo/feature0`, PDF text embegut. _Següent: coordenades de pàgina reals, backend fora del middleware._
3. **`question-answer-extraction`** (pas 3–4 fet): contracte `domain/…`, façana `features/…/server/questionAnswerExtractionHttpRoute.ts`, API local **`npm run dev:qae-api`** (`POST /api/question-answer-extraction`, multipart `file`). Següent: UI o integració backend estable; motors addicionals si cal.
4. **Altres** (pendent): segons prioritat (p. ex. preprocessing, privacitat, millores de plantilla).

Actualitzacions d’aquest fitxer quan canviï el pla de producte.
