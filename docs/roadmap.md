# Roadmap (esquelet)

Ordre orientatiu; les dates i el detall els fixa el PM. Normativa tècnica i lectura: `llm.txt`, `AGENTS_ARQUITECTURA.md`.

1. **Foundations** (fet): repo, frontend canònic buit, docs, CI, Docker.
2. **Feature 0** (en curs, pivot aplicat): **viabilitat de plantilla per regions de resposta** — `validateTemplateFeasibility`, contracte `ok|ko` + `answer_regions`, stub + ruta LLM local (Vite), demo `/demo/feature0`, PDF text embegut. *Següent: coordenades de pàgina reals, backend fora del middleware.*
3. **`question-answer-extraction`** (spike pas 1 fet): raster + `tesseract.js` + marcadors + segmentació simple; `npm run spike:qae` (veure `docs/ESTAT.md`). Pas 2: contracte `domain/` + producte estable.
4. **Altres** (pendent): segons prioritat (p. ex. preprocessing, privacitat, millores de plantilla).

Actualitzacions d’aquest fitxer quan canviï el pla de producte.
