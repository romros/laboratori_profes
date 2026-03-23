/**
 * Genera fitxers versionables sota docs/ amb el payload real de la passada 2:
 * - cos `role=user` (el que enviem a l’API)
 *
 * La resposta del model (`enrich-pass2-model-output.json`) es copia des del fixture
 * `hospitalDawGolden.enriched-output.json` (generat amb clau API); executa writeEnrichedHospitalFixture si cal.
 *
 * Ús: npm run write:enrich-pass2-artifacts -w @profes/frontend
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildEnrichAssessmentSpecPrompt } from '../src/features/assessment-spec-builder/services/enrichAssessmentSpecPrompt'
import {
  hospitalDawExamText,
  hospitalDawSolutionText,
} from '../tests/fixtures/assessment-spec-builder/hospitalDawGolden'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appsFrontend = path.join(__dirname, '..')
const examplesDir = path.join(appsFrontend, '../../docs/features/assessment-spec-builder/examples')

const specPath = path.join(
  appsFrontend,
  'tests/fixtures/assessment-spec-builder/hospitalDawGolden.real-output.json',
)
const spec = JSON.parse(readFileSync(specPath, 'utf8')) as unknown

const userPayload = buildEnrichAssessmentSpecPrompt({
  specJson: JSON.stringify(spec, null, 2),
  examText: hospitalDawExamText,
  solutionText: hospitalDawSolutionText,
})

const header = `# Cos exacte enviat a l'API com a missatge d'usuari (role=user), passada 2 enrich.\n# Generat: npm run write:enrich-pass2-artifacts -w @profes/frontend\n\n---\n\n`

const userOut = path.join(examplesDir, 'enrich-pass2-user-payload.txt')
writeFileSync(userOut, header + userPayload + '\n', 'utf8')
console.info('Wrote', userOut, 'bytes', Buffer.byteLength(header + userPayload, 'utf8'))

const enrichedPath = path.join(
  appsFrontend,
  'tests/fixtures/assessment-spec-builder/hospitalDawGolden.enriched-output.json',
)
const modelOut = path.join(examplesDir, 'enrich-pass2-model-output.json')
try {
  const body = readFileSync(enrichedPath, 'utf8')
  JSON.parse(body)
  writeFileSync(modelOut, body.trimEnd() + '\n', 'utf8')
  console.info('Wrote', modelOut, 'from fixture')
} catch (e) {
  console.error(
    'Falta tests/fixtures/.../hospitalDawGolden.enriched-output.json (resposta real del model).',
  )
  console.error(e)
  process.exitCode = 1
}
