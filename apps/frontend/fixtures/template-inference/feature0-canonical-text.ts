/**
 * Textos canònics Feature 0 (regressió + demo).
 * Els substrings `FIXTURE_SENTINEL_*` només els interpreta `simpleRuleBasedDraftSource` (stub);
 * no són heurístiques de producte.
 */

/** Text massa curt per al llindar del stub (< MIN_TEXT_CHARS). */
export const CANONICAL_TEXT_TOO_SHORT = 'curt'

/**
 * Substring únic: força esborrany amb enunciat/resposta no separables (mateix ganxo que `???` al stub).
 */
export const FIXTURE_SENTINEL_AMBIGUOUS = '[[feature0:canonical/ambiguous]]'

/** Text amb estructura ambigua per al model de regions (barreja enunciat/resposta). */
export const CANONICAL_TEXT_AMBIGUOUS = `1234567890 Examen ${FIXTURE_SENTINEL_AMBIGUOUS} amb zones poc clares.`

/**
 * Dues preguntes amb respostes clares (text «natural»): el stub retorna plantilla viable → status ok.
 */
export const CANONICAL_TEXT_CLEAR_TWO_QUESTIONS = `1234567890 Examen
1) Què és la fotosíntesi? Resposta: procés pel qual les plantes transformen llum en energia.
2) Nomina tres tipus de roques. Resposta: ígnia, sedimentària, metamòrfica.`

/** Substring: simula sortida tipus LLM amb regions no separables (regressió `prompt_answer_regions_not_separable`). */
export const FIXTURE_SENTINEL_REGRESSION_TWO_OPEN_ONLY = '[[feature0:canonical/two-open-only]]'

export const CANONICAL_TEXT_REGRESSION_TWO_OPEN_ONLY = `1234567890 ${FIXTURE_SENTINEL_REGRESSION_TWO_OPEN_ONLY} dues preguntes obertes sense ítems tancats detectats.`

/** Substring: esborrany amb `layout_stable: false` (layout no fiable per delimitar regions). */
export const FIXTURE_SENTINEL_SEMI_STRUCTURED = '[[feature0:canonical/semi-structured]]'

export const CANONICAL_TEXT_SEMI_STRUCTURED = `1234567890 ${FIXTURE_SENTINEL_SEMI_STRUCTURED} Enunciat amb resposta llarga sense caixa delimitada clara.`
