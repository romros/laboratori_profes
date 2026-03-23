/**
 * Escriu només l’AssessmentSpec enriquit (Feature 2.1) a
 * tests/fixtures/assessment-spec-builder/hospitalDawGolden.enriched-output.json
 * sense modificar hospitalDawGolden.real-output.json.
 *
 * Clau: ASSESSMENT_SPEC_OPENAI_API_KEY | OPENAI_API_KEY | FEATURE0_OPENAI_API_KEY
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { assessmentSpecSchema } from '../src/domain/assessment-spec/assessmentSpec.schema'
import { enrichAssessmentSpec } from '../src/features/assessment-spec-builder/services/enrichAssessmentSpec'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolveApiKey(): string {
  return (
    process.env.ASSESSMENT_SPEC_OPENAI_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.FEATURE0_OPENAI_API_KEY?.trim() ||
    ''
  )
}

const apiKey = resolveApiKey()
if (!apiKey) {
  console.error('Cal ASSESSMENT_SPEC_OPENAI_API_KEY, OPENAI_API_KEY o FEATURE0_OPENAI_API_KEY.')
  process.exit(1)
}

const fixtureDir = path.join(__dirname, '../tests/fixtures/assessment-spec-builder')
const inPath = path.join(fixtureDir, 'hospitalDawGolden.real-output.json')
const outPath = path.join(fixtureDir, 'hospitalDawGolden.enriched-output.json')

const base = assessmentSpecSchema.parse(JSON.parse(readFileSync(inPath, 'utf8')))

const enriched = await enrichAssessmentSpec({
  spec: base,
  apiKey,
  baseUrl: process.env.ASSESSMENT_SPEC_OPENAI_BASE_URL,
  model: process.env.ASSESSMENT_SPEC_OPENAI_MODEL,
})

writeFileSync(outPath, `${JSON.stringify(enriched, null, 2)}\n`, 'utf8')
console.info(outPath)
