// scripts/rules-check.ts — enforces golden rules: file size, purpose header, engine/story purity
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SRC_EXT = /\.(ts|tsx|css)$/
const MAX_LINES = 200
const MAX_STORY_LINES = 400
const BANNED_IN_PURE = [
  { re: /\bMath\.random\b/, why: 'use the seeded rng (engine/rng.ts)' },
  { re: /\bDate\b/, why: 'no Date in engine/story (keeps it deterministic)' },
  { re: /\b(window|document|localStorage|sessionStorage)\b/, why: 'no DOM/storage in engine/story' },
  { re: /from\s+['"]react/, why: 'no React in engine/story' },
]

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const problems: string[] = []
const files = ['src', 'scripts', 'tests'].flatMap((d) => walk(join(ROOT, d))).filter((f) => SRC_EXT.test(f))

for (const file of files) {
  const rel = relative(ROOT, file).split('\\').join('/')
  const lines = readFileSync(file, 'utf8').split('\n')
  const limit = rel.startsWith('src/story/chapters/') ? MAX_STORY_LINES : MAX_LINES
  if (lines.length > limit) problems.push(`${rel}: ${lines.length} lines (max ${limit}). Split it.`)
  if (!/^(\/\/|\/\*)/.test(lines[0] ?? '')) problems.push(`${rel}: first line must be a one-line purpose comment.`)
  if (rel.startsWith('src/engine/') || rel.startsWith('src/story/')) {
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return
      for (const b of BANNED_IN_PURE) if (b.re.test(line)) problems.push(`${rel}:${i + 1}: ${b.why}`)
    })
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`rules ERROR ${p}`)
  process.exit(1)
}
console.log(`rules ok: ${files.length} files checked`)
