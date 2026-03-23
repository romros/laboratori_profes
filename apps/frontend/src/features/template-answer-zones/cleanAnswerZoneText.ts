/**
 * Neteja de boilerplate tipogràfic dins dels rangs de resposta.
 *
 * Heurística conservadora: millor deixar soroll que eliminar resposta real.
 * Regles simples, explicables i ajustables.
 *
 * Patrons eliminats (observats als PDFs reals ex_alumne2–4):
 * 1. Capçaleres institucionals: "Generalitat", "Departament", "INS ...", "AVALUACIÓ"
 * 2. Numeració de pàgina: "Pàgina X de Y"
 * 3. Línies de separació: "----...", "════...", etc.
 * 4. Fragments d'enunciat residuals: línies que comencen per N. o N) seguit de verbs
 *    d'enunciat (Creació, Inserir, Assignar, Actualitzar, Eliminar, Modificar, Crear)
 *    — NOMÉS si la línia és clarament un enunciat (conté "punts" o "punt" al final)
 * 5. Línies de boilerplate de formulari: "AVALUACIÓ", "Nom:", "Curs:", "Grup:"
 * 6. Línies excessivament repetides al llarg del document (≥ 3 ocurrències)
 *
 * NO s'eliminen:
 * - Línies úniques sense coincidència amb cap patró
 * - Línies que semblen codi SQL (CREATE, INSERT, SELECT, UPDATE, DELETE, ALTER, DROP)
 * - Línies curtes amb contingut potencialment vàlid (< 3 paraules no filtrades)
 */

/**
 * Patrons de boilerplate institucional — sempre eliminats.
 * Case-insensitive, coincidència parcial.
 */
const INSTITUTIONAL_PATTERNS: RegExp[] = [
  /generalitat\s+de\s+catalunya/i,
  /departament\s+d['']?ensenyament/i,
  /ins\s+francesc\s+vidal/i,
  /avaluaci[oó]\s*[vV]?$/i,
  /^\s*avaluaci[oó]\s*$/i,
]

/**
 * Patrons de pàgina / numeració.
 */
const PAGE_NUMBER_PATTERNS: RegExp[] = [/p[àa]gina\s+\d+\s+de\s+\d+/i, /^\s*p[àa]g\.?\s*\d+\s*$/i]

/**
 * Línies de separació gràfica (guions, signes de puntuació repetits ≥ 4 vegades).
 */
const SEPARATOR_PATTERN = /^[\s\-_=—─━·•~*/#]{4,}$/

/**
 * Patrons d'enunciat residual: N. Text d'enunciat (X punts) o (X,XX punts)
 * Conservador: només si acaba amb patró de puntuació o conté paraules clau
 * d'enunciat molt clares.
 */
const STATEMENT_RESIDUAL_PATTERN =
  /^\s*\d+[.)]\s+(creaci[oó]|inserir|assignar|actualitzar|eliminar|modificar|crear|esborra|selecciona|llistar|mostrar)/i

/**
 * Paraules clau SQL que protegeixen la línia de ser eliminada.
 * Si una línia conté alguna d'aquestes, mai s'elimina per cap heurística de boilerplate.
 */
const SQL_KEYWORDS_PATTERN =
  /\b(CREATE|INSERT|SELECT|UPDATE|DELETE|ALTER|DROP|TABLE|FROM|WHERE|JOIN|PRIMARY|FOREIGN|REFERENCES|INDEX|VIEW|PROCEDURE|TRIGGER|INTO|VALUES|SET|ON|KEY|NOT|NULL|UNIQUE|CHECK|DEFAULT|AUTO_INCREMENT|CONSTRAINT|CASCADE)\b/i

/**
 * Patrons de formulari administratiu.
 */
const FORM_PATTERNS: RegExp[] = [
  /^\s*(nom|curs|grup|data|nota|qualificaci[oó]|professor|alumne)\s*:/i,
  /^\s*mcscizrt\s*/i, // artefacte OCR repetit als PDFs reals
]

/**
 * Neteja boilerplate d'una llista de línies OCR d'un rang de resposta.
 *
 * @param lines - Línies del rang (pot contenir línies buides)
 * @param allDocumentLines - Totes les línies del document (per detectar repeticions)
 * @returns Línies netes (pot ser buida si tot era boilerplate)
 */
export function cleanAnswerZoneLines(lines: string[], allDocumentLines: string[]): string[] {
  // Compta freqüència de cada línia normalitzada al document complet
  // Línies que apareixen ≥ 3 vegades en el document → probable boilerplate
  const docFrequency = new Map<string, number>()
  for (const line of allDocumentLines) {
    const key = line.trim().toLowerCase()
    if (key.length >= 5) {
      docFrequency.set(key, (docFrequency.get(key) ?? 0) + 1)
    }
  }

  return lines.filter((line) => {
    const trimmed = line.trim()

    // Línies buides → sempre eliminar
    if (trimmed.length === 0) return false

    // Protecció SQL: mai eliminar si sembla codi SQL
    if (SQL_KEYWORDS_PATTERN.test(trimmed)) return true

    // Separadors gràfics
    if (SEPARATOR_PATTERN.test(trimmed)) return false

    // Capçaleres institucionals
    if (INSTITUTIONAL_PATTERNS.some((p) => p.test(trimmed))) return false

    // Numeració de pàgina
    if (PAGE_NUMBER_PATTERNS.some((p) => p.test(trimmed))) return false

    // Patrons de formulari
    if (FORM_PATTERNS.some((p) => p.test(trimmed))) return false

    // Fragments d'enunciat residuals (sense protecció SQL, ja comprovada)
    if (STATEMENT_RESIDUAL_PATTERN.test(trimmed)) return false

    // Línies molt repetides al document (≥ 3 ocurrències) i curtes (< 60 chars)
    // No elimina línies llargues repetides (podria ser resposta copiada)
    const key = trimmed.toLowerCase()
    const freq = docFrequency.get(key) ?? 0
    if (freq >= 3 && trimmed.length < 60) return false

    return true
  })
}

/**
 * Neteja boilerplate d'un text de zona (string amb \n).
 * Wrapper de `cleanAnswerZoneLines` per ús directe amb strings.
 *
 * @param zoneText - Text del rang (línies separades per \n)
 * @param allDocumentText - Tot el text del document (per detectar repeticions)
 */
export function cleanAnswerZoneText(zoneText: string, allDocumentText: string): string {
  const lines = zoneText.split('\n')
  const allLines = allDocumentText.split('\n')
  return cleanAnswerZoneLines(lines, allLines).join('\n')
}
