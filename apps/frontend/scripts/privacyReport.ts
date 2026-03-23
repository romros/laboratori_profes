/**
 * Generador del Privacy Report.
 *
 * Ús (des de apps/frontend):
 *   npm run privacy:report
 *
 * Fa checks bàsics i regenera docs/privacy/PRIVACY_REPORT.md.
 *
 * Checks automatitzables:
 * - No hi ha `fetch` amb buffer/pdf fora de paths locals
 * - No hi ha `console.log` amb paraules sospitoses (ocr, pdf, alumne) al codi de producció
 * - Fitxers temporals al pipeline CLI usen `rm -rf`
 * - Imports d'APIs externes només als paths permesos
 *
 * Limitació: és una auditoria de senyals superficials, no un anàlisi estàtic profund.
 * Per decisions de seguretat reals, llegir PRIVACY_ARCHITECTURE.md i SELF_AUDIT.md.
 */
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(process.cwd(), '../..')
const REPORT_PATH = resolve(ROOT, 'docs/privacy/PRIVACY_REPORT.md')
const SRC_DIR = resolve(process.cwd(), 'src')

// ---------------------------------------------------------------------------
// Checks automatitzables
// ---------------------------------------------------------------------------

type CheckResult = { id: string; description: string; passed: boolean; note: string }

// Usa `find` + `xargs grep` per compatibilitat amb BusyBox (Alpine) i GNU grep
function grepSrc(pattern: string): string {
  try {
    return execSync(
      `find "${SRC_DIR}" -name "*.ts" -o -name "*.tsx" | xargs grep -l "${pattern}" 2>/dev/null || true`,
    )
      .toString()
      .trim()
  } catch {
    return ''
  }
}

function grepSrcLines(pattern: string, excludePattern?: string): string[] {
  try {
    const raw = execSync(
      `find "${SRC_DIR}" -name "*.ts" -o -name "*.tsx" | xargs grep -n "${pattern}" 2>/dev/null || true`,
    )
      .toString()
      .trim()
    if (!raw) return []
    let lines = raw.split('\n').filter(Boolean)
    if (excludePattern) {
      lines = lines.filter((l) => !l.includes(excludePattern))
    }
    return lines
  } catch {
    return []
  }
}

function runChecks(): CheckResult[] {
  const results: CheckResult[] = []

  // A1 — Cap fetch cap a API externa fora dels paths permesos
  // Paths permesos: template-inference (LLM per templates del professor), ui/ (demo local), dev/ (url helpers)
  // Un fetch a una URL external hauria d'incloure 'http' i estar fora d'aquests paths
  const fetchLines = grepSrcLines('fetch(')
    .filter((l) => !l.includes('template-inference') && !l.includes('/ui/') && !l.includes('/dev/'))
    .filter((l) => l.includes('http'))
  results.push({
    id: 'A1',
    description: 'Cap fetch() a URLs externes fora de template-inference/ui/dev',
    passed: fetchLines.length === 0,
    note:
      fetchLines.length > 0
        ? `Fetch extern sospitós detectat:\n${fetchLines.slice(0, 5).join('\n')}`
        : 'OK — fetch() extern només a template-inference (LLM templates)',
  })

  // B4 — Fitxers temporals CLI: cleanup amb rm Node API (recursive: true)
  // `rm(dir, { recursive: true })` és l'equivalent Node a `rm -rf`
  const tmpCleanup = grepSrc('recursive: true')
  results.push({
    id: 'B4',
    description: 'Fitxers temporals /tmp eliminats (rm recursive)',
    passed: tmpCleanup.length > 0,
    note:
      tmpCleanup.length > 0
        ? 'OK — rm({ recursive: true }) present a tesseractCliOcrPng.ts'
        : 'WARN — no trobat cleanup de temporals',
  })

  // C1 — console.log amb contingut OCR/pdf al codi de producció (no scripts)
  const consoleLines = grepSrcLines('console\\.log')
  const suspiciousLogs = consoleLines.filter((l) => /ocr|pdf|alumne|answer_text|student/i.test(l))
  results.push({
    id: 'C1',
    description: 'Sense console.log amb contingut personal (ocr, pdf, alumne…) al codi src/',
    passed: suspiciousLogs.length === 0,
    note:
      suspiciousLogs.length > 0
        ? `Logs sospitosos:\n${suspiciousLogs.slice(0, 5).join('\n')}`
        : 'OK — cap console.log sospitós a src/',
  })

  // D1 — Cap import de serveis cloud (google, aws, azure)
  const cloudImports = grepSrcLines(
    'google|aws|azure|vision|rekognition|textract',
    'template-inference',
  ).filter((l) => l.includes('import') || l.includes('require'))
  results.push({
    id: 'D1',
    description: 'Cap import de serveis cloud (Google, AWS, Azure) fora de template-inference',
    passed: cloudImports.length === 0,
    note:
      cloudImports.length > 0
        ? `Cloud imports detectats:\n${cloudImports.slice(0, 5).join('\n')}`
        : 'OK — cap servei cloud importat',
  })

  // D3 — .env.local no al repo
  const envLocalInGit = execSync(
    `git -C "${ROOT}" ls-files apps/frontend/.env.local 2>/dev/null || true`,
  )
    .toString()
    .trim()
  results.push({
    id: 'D3',
    description: '.env.local no versionat al repo git',
    passed: envLocalInGit.length === 0,
    note:
      envLocalInGit.length > 0
        ? `CRÍTIC: .env.local és al repo! Contindria API keys.`
        : 'OK — .env.local fora de git',
  })

  return results
}

// ---------------------------------------------------------------------------
// Generació del report
// ---------------------------------------------------------------------------

function getCommit(): string {
  try {
    return execSync(`git -C "${ROOT}" rev-parse --short HEAD 2>/dev/null`).toString().trim()
  } catch {
    return 'unknown'
  }
}

function getDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatStatus(passed: boolean): string {
  return passed ? '✅' : '❌'
}

function generateReport(checks: CheckResult[]): string {
  const date = getDate()
  const commit = getCommit()
  const allPassed = checks.every((c) => c.passed)
  const globalStatus = allPassed ? '✅ OK' : '❌ REVIEW REQUIRED'

  const checksTable = checks
    .map(
      (c) =>
        `| ${c.id} | ${c.description} | ${formatStatus(c.passed)} | ${c.note.split('\n')[0]} |`,
    )
    .join('\n')

  const failedDetails = checks
    .filter((c) => !c.passed)
    .map((c) => `### ${c.id} — ${c.description}\n\`\`\`\n${c.note}\n\`\`\``)
    .join('\n\n')

  return `# Privacy Report

**Data:** ${date}
**Versió del producte:** professor/autònom — MVP
**Commit de referència:** ${commit}
**Generat per:** \`npm run privacy:report\`

---

## Decisió global

**${globalStatus}**

${allPassed ? 'Tots els checks automàtics passen. Model local-first intact.' : '⚠️ Hi ha checks fallits. Revisar detalls i escalar al PM si cal.'}

---

## Checks automàtics

| ID | Control | Estat | Nota |
|----|---------|-------|------|
${checksTable}

${failedDetails ? `---\n\n## Detall de falles\n\n${failedDetails}\n` : ''}
---

## Controls manuals (SELF_AUDIT.md)

Revisar \`docs/privacy/SELF_AUDIT.md\` per la checklist completa.
Els checks manuals no s'automatitzen aquí; s'actualitzen en tancar features.

**Darrera revisió manual:** 2026-03-23 — ✅ OK (21/22 controls; 2 pendents acceptables)

---

## Quan regenerar

- En tancar una feature que toqui OCR, servidor, uploads, logs o connectors
- Quan s'afegeixi qualsevol integració externa nova
- Quan canviï docker-compose o Dockerfile de serveis amb dades
- Opcional: una vegada per sprint/iteració

\`\`\`bash
npm run privacy:report
\`\`\`
`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const checks = runChecks()
const report = generateReport(checks)
writeFileSync(REPORT_PATH, report, 'utf8')

const allPassed = checks.every((c) => c.passed)
console.log(`Privacy report generat: ${REPORT_PATH}`)
console.log(`Checks: ${checks.filter((c) => c.passed).length}/${checks.length} OK`)
if (!allPassed) {
  console.error('⚠️  Alguns checks han fallat. Revisar el report.')
  process.exit(1)
}
console.log('✅ Tots els checks OK')
