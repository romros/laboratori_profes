/**
 * Gate de qualitat semàntica OCR — pre-router, sense LLM.
 *
 * Problema detectat (Spike 3.D):
 *   El router calcula soroll de caràcters amb \p{L} (Unicode letters), de manera que
 *   textos com "CRERTE T10y5. ferp ll" o "VBRCHBR" passen com a 0% soroll perquè
 *   les lletres són vàlides Unicode — però semànticament el text és il·legible.
 *
 * Objectiu:
 *   Detectar si el text OCR té prou SENYAL SEMÀNTIC per ser avaluable via text,
 *   independentment de si els caràcters individuals són "vàlids".
 *
 * Mètode: combinació de tres heurístiques lleugeres:
 *   1. SQL fuzzy signal — tokens que s'assemblen a paraules clau SQL/DDL (tolerant a OCR)
 *   2. Gibberish token ratio — proporció de tokens que no semblen plausibles
 *      (combina: consonant-run, vocal-ratio, dígit-al-mig)
 *   3. Plausible identifier density — presència de tokens que semblen noms de camps/taules
 */

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Paraules clau SQL/DDL en forma de patrons "fuzzy" tolerants a errors OCR típics.
 * Exemples acceptats: CREATE→CREAT, CRERTE; TABLE→TABL, TBALE; PRIMARY→PRIMANY, PRIMAR
 */
const SQL_FUZZY_PATTERNS: RegExp[] = [
  // CREATE: accepta confusió de lletres finals
  /^cre[ae]t[ea]?[dr]?$/i,
  // TABLE: accepta tabl, tbale, tabla, taula
  /^ta[bpd][lae]{0,2}[a-z]?$/i,
  // INSERT
  /^ins[ae]rt?$/i,
  // INTO
  /^int[oa]$/i,
  // UPDATE
  /^upd[ae]t[ea]?$/i,
  // DELETE
  /^del[ea]t[ea]?$/i,
  // SELECT
  /^sel[ea]ct?$/i,
  // PRIMARY: accepta PRIMAR, PRIMANY, PRYMARY
  /^pr[iy]m[ae]r[yn]?[ay]?$/i,
  // FOREIGN: accepta FOREI, FOREIN, FREING
  /^for[ea]i[gn]{1,2}$/i,
  // REFERENCES: accepta REFERENC, REFERNCE, REFERENS
  /^ref[ea]r[ea]n[cs][ea]?s?$/i,
  // VALUES
  /^val[uv][ea]s?$/i,
  // CHECK
  /^ch[ea][ck]{1,2}$/i,
  // NOT NULL (tokens separats)
  /^no[t]?$/i,
  /^nu[l]{1,2}$/i,
  // CONSTRAINT
  /^cons[ta]{1,2}r?[ai]n[t]?$/i,
  // VARCHAR, CHAR, INT, FLOAT, DATE
  /^v[ae]rch[ae]r?$/i,
  /^ch[ae]r?$/i,
  /^in[t]?$/i,
  /^fl[ou][ae]t?$/i,
  /^d[ae]t[ea]$/i,
  // ON (del ON DELETE / ON UPDATE)
  /^on$/i,
  // CASCADE
  /^c[ae]sc[ae]d[ea]?$/i,
  // ALTER
  /^[ae]lt[ea]r?$/i,
  // KEY: accepta KYE, KEI
  /^k[ea][yi]$/i,
  // WHERE, FROM
  /^wh[ea]r[ea]?$/i,
  /^fr[oa]m?$/i,
]

// ── Heurística de gibberish ───────────────────────────────────────────────────

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'à', 'è', 'é', 'í', 'ï', 'ó', 'ò', 'ú', 'ü'])

// Combinacions consonàntiques vàlides en català/castellà/anglès/SQL
const VALID_CONSONANT_CLUSTERS = [
  'ch',
  'ck',
  'ct',
  'cr',
  'cl',
  'gr',
  'pr',
  'tr',
  'br',
  'dr',
  'fr',
  'str',
  'nt',
  'nc',
  'nd',
  'ng',
  'nk',
  'ns',
  'nch',
  'lt',
  'lf',
  'lm',
  'lp',
  'lv',
  'mp',
  'mb',
  'mn',
  'pt',
  'ph',
  'ps',
  'sk',
  'sp',
  'st',
  'sc',
  'sm',
  'sn',
  'sw',
  'th',
  'wh',
  'rch',
  'rk',
  'rm',
  'rn',
  'rp',
  'rs',
  'rt',
  'rv',
]

/**
 * Detecta si un token és probablement gibberish OCR.
 *
 * Tres heurístiques combinades:
 *   1. Dígit al mig de lletres → patró OCR corrupte (T10y5, C0d3)
 *   2. ≥4 consonants consecutives sense vocal vàlida (VBRCHBR, NRRCHAR)
 *   3. Rati de vocals < 20% per a tokens ≥4 lletres (CRERTE=17%, AJULL=20%, VARCMAL=14%)
 *      Paraules reals: Hospital=37%, carrer=33%, varchar=29% — sobre el threshold
 */
export function isGibberishToken(token: string): boolean {
  const t = token.toLowerCase()

  // Massa curt per detectar amb fiabilitat (1-2 chars OK normalment)
  if (t.length <= 2) return false

  // 1. Dígit al mig de lletres → OCR corrupte (T10y5, C0d3, M2x7)
  if (/[A-Za-z]\d[A-Za-z]/.test(t)) return true

  // Treballa només amb la part alfabètica per les heurístiques restants
  const lettersOnly = t.replace(/[^a-zà-öø-ÿ]/g, '')
  if (lettersOnly.length < 3) return false

  // 2. Consonants consecutives sense vocal
  let maxConsonantRun = 0
  let currentRun = 0
  for (const ch of lettersOnly) {
    if (VOWELS.has(ch)) {
      currentRun = 0
    } else {
      currentRun++
      if (currentRun > maxConsonantRun) maxConsonantRun = currentRun
    }
  }

  // 4+ consonants consecutives → gibberish (VBRCHBR, NRRCHAR, MNCXVZ)
  if (maxConsonantRun >= 4) return true

  // 3 consonants consecutives sense cluster válid → gibberish
  if (maxConsonantRun === 3) {
    const hasValidCluster = VALID_CONSONANT_CLUSTERS.some((cluster) => t.includes(cluster))
    if (!hasValidCluster) return true
  }

  // 3. Vocal-ratio molt baix per a tokens ≥4 lletres → probable OCR corrupte
  // Threshold calibrat amb casos reals:
  //   Gibberish: CRERTE=1/6=17%, AJULL=1/5=20%, VARCMAL=1/7=14%, PUMEO→PMEO=0/4=0%
  //   Real: Hospital=3/8=37%, carrer=2/6=33%, varchar=2/7=29%, Hospital=3/8=37%
  //   Borderline: ferp=1/4=25%, AULL=2/4=50% (AULL és variant de NULL, ok)
  if (lettersOnly.length >= 4) {
    const vowelCount = lettersOnly.split('').filter((c) => VOWELS.has(c)).length
    const vowelRatio = vowelCount / lettersOnly.length
    // Threshold 0.20: CRERTE (17%) i VARCMAL (14%) cauen; varchar (29%) i carrer (33%) passen
    if (vowelRatio < 0.2) return true
  }

  return false
}

// ── Resultat del gate ─────────────────────────────────────────────────────────

export type SemanticOcrQuality = 'usable' | 'uncertain' | 'unreadable'

export type SemanticOcrQualityResult = {
  quality: SemanticOcrQuality
  reason: string
  /** Nombre de tokens amb senyal SQL fuzzy detectat */
  sqlFuzzySignalCount: number
  /** Rati de tokens que semblen gibberish */
  gibberishRatio: number
  /** Rati de tokens que semblen identificadors plausibles */
  plausibleIdentifierRatio: number
}

// ── Thresholds ────────────────────────────────────────────────────────────────

/**
 * Mínim de tokens SQL fuzzy per considerar intenció SQL recognoscible.
 * 2 tokens és suficient: equivalents de "CREATE TABLE".
 */
const MIN_SQL_FUZZY_SIGNALS = 2

/**
 * Rati màxim de gibberish per considerar el text usable (via SQL signal).
 */
const MAX_GIBBERISH_RATIO_USABLE = 0.5

/**
 * Rati màxim de gibberish per zona uncertain (entre usable i unreadable).
 * > d'aquest valor → unreadable.
 */
const MAX_GIBBERISH_RATIO_UNCERTAIN = 0.7

/**
 * Mínim de tokens per fer l'anàlisi significativa.
 */
const MIN_TOKENS_FOR_ANALYSIS = 3

// ── Funció principal ──────────────────────────────────────────────────────────

/**
 * Detecta la qualitat semàntica d'un text OCR.
 *
 * Retorna:
 *   'usable'    — text amb prou senyal semàntic per avaluar
 *   'uncertain' — text parcialment llegible, possible intenció identificable
 *   'unreadable'— text dominat per gibberish, cap intenció semàntica clara
 *
 * No fa cap crida LLM. O(n) sobre els tokens del text.
 */
export function detectSemanticOcrQuality(text: string): SemanticOcrQualityResult {
  const trimmed = text.trim()

  // Tokenitzem per paraules (alfa/numèric, guió baix)
  const tokens = trimmed
    .split(/[\s,;()[\]{}\n\r\t]+/)
    .map((t) => t.replace(/^[^A-Za-zÀ-ÖØ-öø-ÿ0-9_]+|[^A-Za-zÀ-ÖØ-öø-ÿ0-9_]+$/g, ''))
    .filter((t) => t.length > 0)

  if (tokens.length < MIN_TOKENS_FOR_ANALYSIS) {
    return {
      quality: 'uncertain',
      reason: `Massa pocs tokens per analitzar (${tokens.length}). Qualitat incerta.`,
      sqlFuzzySignalCount: 0,
      gibberishRatio: 0,
      plausibleIdentifierRatio: 0,
    }
  }

  // ── 1. SQL fuzzy signal ────────────────────────────────────────────────────

  let sqlFuzzySignalCount = 0
  for (const token of tokens) {
    if (SQL_FUZZY_PATTERNS.some((p) => p.test(token))) {
      sqlFuzzySignalCount++
    }
  }

  // ── 2. Gibberish token ratio ───────────────────────────────────────────────

  let gibberishCount = 0
  for (const token of tokens) {
    // No comptem tokens molt curts (1-2 chars) — massa ambigus
    if (token.length > 2 && isGibberishToken(token)) {
      gibberishCount++
    }
  }
  const gibberishRatio = gibberishCount / tokens.length

  // ── 3. Plausible identifier ratio ─────────────────────────────────────────

  const PLAUSIBLE_IDENTIFIER_RE = /^[A-Za-z][A-Za-zÀ-ÖØ-öø-ÿ0-9_]{1,39}$/
  let plausibleCount = 0
  for (const token of tokens) {
    if (PLAUSIBLE_IDENTIFIER_RE.test(token) && !isGibberishToken(token)) {
      plausibleCount++
    }
  }
  const plausibleIdentifierRatio = plausibleCount / tokens.length

  // ── Decisió ───────────────────────────────────────────────────────────────

  // Cas 1: gibberish domina → unreadable (independentment del SQL signal)
  if (gibberishRatio > MAX_GIBBERISH_RATIO_UNCERTAIN) {
    return {
      quality: 'unreadable',
      reason: `Gibberish ${(gibberishRatio * 100).toFixed(0)}% dels tokens (>${Math.round(MAX_GIBBERISH_RATIO_UNCERTAIN * 100)}%). Text semànticament il·legible.`,
      sqlFuzzySignalCount,
      gibberishRatio,
      plausibleIdentifierRatio,
    }
  }

  // Cas 2: prou senyal SQL fuzzy i gibberish acceptable → usable
  if (
    sqlFuzzySignalCount >= MIN_SQL_FUZZY_SIGNALS &&
    gibberishRatio <= MAX_GIBBERISH_RATIO_USABLE
  ) {
    return {
      quality: 'usable',
      reason: `${sqlFuzzySignalCount} tokens SQL fuzzy detectats, gibberish ${(gibberishRatio * 100).toFixed(0)}%. Intenció SQL recognoscible.`,
      sqlFuzzySignalCount,
      gibberishRatio,
      plausibleIdentifierRatio,
    }
  }

  // Cas 3: gibberish moderat sense prou SQL → uncertain
  if (gibberishRatio > MAX_GIBBERISH_RATIO_USABLE) {
    return {
      quality: 'uncertain',
      reason: `Gibberish ${(gibberishRatio * 100).toFixed(0)}% (>${Math.round(MAX_GIBBERISH_RATIO_USABLE * 100)}%) i senyal SQL insuficient (${sqlFuzzySignalCount} tokens). Qualitat semàntica dubtosa.`,
      sqlFuzzySignalCount,
      gibberishRatio,
      plausibleIdentifierRatio,
    }
  }

  // Cas 4: text majoritàriament plausible amb senyal SQL suficient
  if (plausibleIdentifierRatio >= 0.4 && sqlFuzzySignalCount >= MIN_SQL_FUZZY_SIGNALS) {
    return {
      quality: 'usable',
      reason: `Identificadors plausibles ${(plausibleIdentifierRatio * 100).toFixed(0)}%, ${sqlFuzzySignalCount} token(s) SQL fuzzy. Text semànticament usable.`,
      sqlFuzzySignalCount,
      gibberishRatio,
      plausibleIdentifierRatio,
    }
  }

  // Cas 5: identificadors plausibles sense senyal SQL → uncertain
  // El gate no assumeix domini. Un text amb tokens recognoscibles però sense SQL
  // pot ser HTML, Python, text lliure, etc. — el LLM decidirà si és avaluable.
  if (plausibleIdentifierRatio >= 0.4) {
    return {
      quality: 'uncertain',
      reason: `Identificadors plausibles ${(plausibleIdentifierRatio * 100).toFixed(0)}% però sense senyal SQL/tècnic (${sqlFuzzySignalCount} tokens). Domini indeterminat — el LLM decidirà.`,
      sqlFuzzySignalCount,
      gibberishRatio,
      plausibleIdentifierRatio,
    }
  }

  // Cas 6: poc senyal positiu → uncertain
  return {
    quality: 'uncertain',
    reason: `Senyal semàntic baix: ${sqlFuzzySignalCount} tokens tècnics, identificadors plausibles ${(plausibleIdentifierRatio * 100).toFixed(0)}%. Qualitat incerta — el LLM decidirà.`,
    sqlFuzzySignalCount,
    gibberishRatio,
    plausibleIdentifierRatio,
  }
}
