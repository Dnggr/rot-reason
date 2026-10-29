// scripts/docs-check.ts — "docs last" gate: HANDOFF updated with code changes, and a valid "Next pack" exists
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
const fails: string[] = []
const warns: string[] = []
function changedFiles(): string[] | null {
  try {
    const out = execSync('git status --porcelain', { encoding: 'utf8' })
    return out
      .split('\n')
      .filter(Boolean)
      .map((l) => l.slice(3).replace(/^"|"$/g, '').split(' -> ').pop() ?? '')
  } catch {
    return null
  }
}
function checkNextPack(): void {
  const handoff = existsSync('docs/HANDOFF.md') ? readFileSync('docs/HANDOFF.md', 'utf8') : ''
  const m = handoff.match(/^Next pack:\s*`npm run pack:([a-z][a-z0-9]*)`/m)
  if (!m?.[1]) {
    fails.push('docs/HANDOFF.md needs a line: Next pack: `npm run pack:<name>` (START_HERE Rule 0.5)')
    return
  }
  const name = m[1]
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  if (!pkg.scripts?.[`pack:${name}`]) fails.push(`package.json has no script "pack:${name}" (named in HANDOFF.md Next pack)`)
  const packTs = existsSync('scripts/pack.ts') ? readFileSync('scripts/pack.ts', 'utf8') : ''
  if (!new RegExp(`^\\s*${name}:\\s*\\{`, 'm').test(packTs)) fails.push(`scripts/pack.ts has no preset "${name}" (named in HANDOFF.md Next pack)`)
}
function checkDocsTouched(): void {
  const files = changedFiles()
  if (!files) return void warns.push('git not available: skipped the docs-changed check')
  const isCode = (f: string) =>
    /^(src|scripts|tests)\//.test(f) || /^(package\.json|vite\.config\.ts|tsconfig\.json|repomix\.config\.json)$/.test(f)
  const code = files.filter(isCode)
  const docs = files.filter((f) => f.startsWith('docs/'))
  if (code.length === 0) return
  if (!docs.includes('docs/HANDOFF.md')) {
    fails.push('code changed but docs/HANDOFF.md was not updated. Update it and every doc your change affects (START_HERE Rule 0).')
  } else if (docs.length === 1) {
    warns.push('only HANDOFF.md changed. Did your change affect another doc?')
  }
}
checkNextPack()
checkDocsTouched()
for (const w of warns) console.warn(`docs:check WARN: ${w}`)
if (fails.length > 0) {
  for (const f of fails) console.error(`docs:check FAIL: ${f}`)
  process.exit(1)
}
console.log('docs:check ok')