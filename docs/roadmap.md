# Roadmap (esquelet)

Ordre orientatiu; les dates i el detall els fixa el PM. Normativa tècnica i lectura: `llm.txt`, `AGENTS_ARQUITECTURA.md`.

1. **Foundations** ✓: repo, frontend canònic buit, docs, CI, Docker.
2. **Feature 0** ✓ MVP complet (dues capes):
   - **Capa 1 — Viabilitat de plantilla** ✓: `validateTemplateFeasibility`, contracte `ok|ko` + `answer_regions`, stub + ruta LLM local (Vite), demo `/demo/feature0`, PDF text embegut.
   - **Capa 2 — Layout mapping** ✓: pipeline anchor → zones → contracte de sortida `TemplateMappedAnswersResult`. Verificació template↔scan, detecció d'anchors, derivació de zones, neteja boilerplate, warnings per pregunta. Validat amb 4 PDFs reals: alumne1 → NO MATCH ✓, alumne2–4 → MATCH ✓. Contracte estable a `domain/template-mapped-answers/`. Sense coordenades físiques (fora d'abast MVP). Sense scoring.
3. **Feature 1 — `question-answer-extraction`** ✓ (MVP validat): contracte `domain/…`, servei **`qae-api`** permanent a Docker, **nginx proxy invers** (`/api/…` → `qae-api:8787`, sense ports addicionals), demo UI **`/demo/qae`**. Detecció tolerant de marcadors (3 nivells regex). Separació enunciat/resposta per patró de puntuació. Validat amb 4 PDFs reals (202 tests). Limitacions conegudes documentades a `ESTAT.md`.
4. **Feature 2 — Avaluació de respostes** (pendent PM): scoring, correcció assistida, diferencial real del producte. Punt de partida: contracte `TemplateMappedAnswersResult` de Feature 0 Capa 2.
5. **Pendent tècnic menor** (no bloquejant): coordenades físiques x/y Feature 0 Capa 1; backend producció fora de Vite. **OCR avançat fora d'abast del MVP actual** — 3 rondes de benchmark han confirmat que Tesseract no resol escaneig molt brut; qualsevol millora futura requereix canvi d'estratègia real.

Actualitzacions d’aquest fitxer quan canviï el pla de producte.
