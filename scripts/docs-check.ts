// scripts/docs-check.ts — "docs-last" gate: code changes must ship with docs changes (HANDOFF.md at minimum)
import { execSync } from 'node:child_process'

function changedFiles(): string[] {
  try {
    const out = execSync('git status --porcelain', { encoding: 'utf8' })
    return out
      .split('\n')
      .filter(Boolean)
      .map((l) => l.slice(3).replace(/^"|"$/g, '').split(' -> ').pop() ?? '')
  } catch {
    console.log('docs:check skipped (not a git repo)')
    process.exit(0)
  }
}

const files = changedFiles()
const isCode = (f: string) =>
  /^(src|scripts|tests)\//.test(f) || /^(package\.json|vite\.config\.ts|tsconfig\.json|repomix\.config\.json)$/.test(f)
const code = files.filter(isCode)
const docs = files.filter((f) => f.startsWith('docs/'))

if (code.length === 0) {
  console.log('docs:check ok: no code changes')
  process.exit(0)
}
if (!docs.includes('docs/HANDOFF.md')) {
  console.error('docs:check FAIL: code changed but docs/HANDOFF.md was not updated.')
  console.error('Update HANDOFF.md and every doc your change affects (see START_HERE rule 0).')
  process.exit(1)
}
if (docs.length === 1) console.warn('docs:check WARN: only HANDOFF.md changed. Did your change affect another doc?')
console.log(`docs:check ok: ${code.length} code file(s), ${docs.length} doc file(s) changed`)
