/**
 * Heuristica minima (nom de fitxer): no substitueix analisi de contingut (ruta LLM).
 * Nomes stub: evitar tractar com a plantilla neta un PDF amb nom tipic de solucio.
 */
const SOLUTION_NAME_HINT =
  /soluc(ió|io|ion|ión)|resposta\s*model|correcci(o|ó)\s*model|answer\s*key/i

export function looksLikeSolutionPdfFilename(filename: string): boolean {
  const base = filename.split(/[/\\]/).pop()?.trim() ?? filename.trim()
  return SOLUTION_NAME_HINT.test(base)
}
