// scripts/pack.ts — repomix presets: `npm run pack -- <preset> [globs...]`. Edit PRESETS here only.
import { execSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const BASE = ['docs/START_HERE.md', 'docs/HANDOFF.md'] // every pack carries the docs entry points
const PRESETS: Record<string, { include: string[]; compress?: boolean }> = {
  map: { include: [...BASE, 'src/**'], compress: true },
  docs: { include: ['docs/**', 'README.md'] },
  core: { include: [...BASE, 'docs/ARCHITECTURE.md', 'docs/STORY_FORMAT.md', 'src/engine/**', 'tests/**'] },
  story: {
    include: [...BASE, 'docs/STORY_FORMAT.md', 'docs/STORYBOARD.md', 'docs/CHARACTERS.md', 'docs/HONOR.md', 'src/story/flags.ts', 'src/story/characters.ts'],
  },
  ui: { include: [...BASE, 'docs/UI_UX.md', 'docs/ARCHITECTURE.md', 'src/ui/**', 'src/engine/types.ts', 'src/engine/select.ts'] },
  bug: { include: [...BASE, 'docs/ARCHITECTURE.md'] }, // add the files from the debug log: npm run pack -- bug src/engine/honor.ts
  chapter: { include: [...BASE, 'docs/STORY_FORMAT.md', 'docs/STORYBOARD.md', 'src/story/flags.ts'] }, // add: src/story/chapters/ch2*
}

const [name, ...extra] = process.argv.slice(2)
const preset = name ? PRESETS[name] : undefined
if (!name || !preset) {
  console.error(`usage: npm run pack -- <${Object.keys(PRESETS).join('|')}> [extra globs]`)
  process.exit(1)
}

mkdirSync('.repomix', { recursive: true })
const include = [...preset.include, ...extra].join(',')
const cmd = `npx repomix --include "${include}" -o .repomix/${name}.xml${preset.compress ? ' --compress' : ''}`
console.log(`> ${cmd}`)
execSync(cmd, { stdio: 'inherit' })
