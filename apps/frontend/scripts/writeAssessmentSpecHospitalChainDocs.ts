/**
 * Escriu sota docs/ la cadena hospital DAW en fitxers **separats i llegibles**:
 * sortida passada 1, resposta crua passada 2, sortida passada 2 després del merge (sense API).
 *
 * No crida OpenAI. La resposta LLM de la passada 2 ve del fixture
 * `hospitalDawGolden.enriched-output.json` (només cal API si la regeneres amb write:hospital-enriched-fixture).
 *
 * Ús: npm run write:assessment-spec-hospital-chain -w @profes/frontend
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { assessmentSpecSchema } from '../src/domain/assessment-spec/assessmentSpec.schema'
import {
  mergeEnrichmentPedagogyFields,
  parseEnrichmentPedagogyFromModelJson,
} from '../src/features/assessment-spec-builder/services/enrichAssessmentSpec'
import { buildEnrichAssessmentSpecPrompt } from '../src/features/assessment-spec-builder/services/enrichAssessmentSpecPrompt'
import {
  hospitalDawExamText,
  hospitalDawSolutionText,
} from '../tests/fixtures/assessment-spec-builder/hospitalDawGolden'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appsFrontend = path.join(__dirname, '..')
const chainDir = path.join(
  appsFrontend,
  '../../docs/features/assessment-spec-builder/examples/hospital-daw-chain',
)

const realPath = path.join(
  appsFrontend,
  'tests/fixtures/assessment-spec-builder/hospitalDawGolden.real-output.json',
)
const enrichedPath = path.join(
  appsFrontend,
  'tests/fixtures/assessment-spec-builder/hospitalDawGolden.enriched-output.json',
)

const specRaw = readFileSync(realPath, 'utf8')
const spec = assessmentSpecSchema.parse(JSON.parse(specRaw) as unknown)

const userPayload = buildEnrichAssessmentSpecPrompt({
  specJson: JSON.stringify(spec, null, 2),
  examText: hospitalDawExamText,
  solutionText: hospitalDawSolutionText,
})

const header = `# Passada 2 — cos exacte del missatge role=user (sense cridar cap API).\n# Regenera tota la carpeta hospital-daw-chain: npm run write:assessment-spec-hospital-chain -w @profes/frontend\n\n---\n\n`

writeFileSync(path.join(chainDir, 'pass1-output.json'), specRaw.trimEnd() + '\n', 'utf8')
console.info('Wrote', path.join(chainDir, 'pass1-output.json'))

const enrichedBody = readFileSync(enrichedPath, 'utf8')
const enrichedParsed = JSON.parse(enrichedBody) as unknown
writeFileSync(path.join(chainDir, 'pass2-llm-response.json'), enrichedBody.trimEnd() + '\n', 'utf8')
console.info('Wrote', path.join(chainDir, 'pass2-llm-response.json'))

const pedagogy = parseEnrichmentPedagogyFromModelJson(enrichedParsed)
const merged = mergeEnrichmentPedagogyFields(spec, pedagogy)
const mergedParsed = assessmentSpecSchema.parse(merged)
writeFileSync(
  path.join(chainDir, 'pass2-after-merge.json'),
  JSON.stringify(mergedParsed, null, 2) + '\n',
  'utf8',
)
console.info('Wrote', path.join(chainDir, 'pass2-after-merge.json'))

writeFileSync(path.join(chainDir, 'pass2-user-payload.txt'), header + userPayload + '\n', 'utf8')
console.info('Wrote', path.join(chainDir, 'pass2-user-payload.txt'))
