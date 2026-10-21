// scripts/pack.ts — repomix presets: `npm run pack:<name>` or `npm run pack -- <name> [extra globs]`. Edit PRESETS only.
import { execSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
const BASE = ['docs/START_HERE.md', 'docs/HANDOFF.md'] // every pack carries the docs entry points
const CFG = ['package.json', 'tsconfig.json']
const PACKING = ['scripts/pack.ts', 'docs/REPOMIX.md', 'docs/ROADMAP.md'] // every task pack carries what Rule 0.5 and the decision log need
const PRESETS: Record<string, { include: string[]; compress?: boolean }> = {
  // ---- generic presets (stay forever) ----
  map: { include: [...BASE, 'src/**'], compress: true },
  docs: { include: ['docs/**', 'README.md'] },
  core: { include: [...BASE, ...CFG, 'docs/ARCHITECTURE.md', 'docs/STORY_FORMAT.md', 'src/engine/**', 'tests/**'] },
  story: {
    include: [...BASE, 'docs/STORY_FORMAT.md', 'docs/STORYBOARD.md', 'docs/CHARACTERS.md', 'docs/HONOR.md', 'src/story/flags.ts', 'src/story/characters.ts'],
  },
  ui: { include: [...BASE, 'docs/UI_UX.md', 'docs/ARCHITECTURE.md', 'src/ui/**', 'src/engine/types.ts', 'src/engine/select.ts'] },
  bug: { include: [...BASE, 'docs/ARCHITECTURE.md'] }, // add the files from the debug log: npm run pack -- bug src/engine/honor.ts
  chapter: { include: [...BASE, 'docs/STORY_FORMAT.md', 'docs/STORYBOARD.md', 'src/story/flags.ts'] }, // add: src/story/chapters/ch2*
  // ---- TASK PACKS: one per upcoming session, named <milestone><session> (START_HERE Rule 0.5). Delete when the milestone is done. ----
  m1s1: {
    include: [...BASE, ...CFG, 'docs/ARCHITECTURE.md', 'docs/STORY_FORMAT.md', 'src/engine/**', 'src/story/chapters/index.ts', 'scripts/lint-story.ts', 'tests/**'],
  },
  // M1 s2: conditions, effects, log, honor (+ story/honor.ts deed table), checks, echoes
  m1s2: {
    include: [...BASE, ...CFG, ...PACKING, 'docs/ARCHITECTURE.md', 'docs/STORY_FORMAT.md', 'docs/HONOR.md', 'docs/GAME_DESIGN.md', 'src/engine/**', 'tests/**'],
  },
  // M1 s3: reducer, select, endings, save, test story, lint-story graph checks, fuzz
  m1s3: {
    include: [
      ...BASE, ...CFG, ...PACKING, 'docs/ARCHITECTURE.md', 'docs/STORY_FORMAT.md', 'docs/HONOR.md', 'docs/GAME_DESIGN.md', 'docs/CHARACTERS.md', 'docs/STORYBOARD.md',
      'src/engine/**', 'src/story/**', 'scripts/lint-story.ts', 'scripts/fuzz.ts', 'tests/engine/fixtures.ts',
    ],
  },
}
const [name, ...extra] = process.argv.slice(2)
const preset = name ? PRESETS[name] : undefined
if (!name || !preset) {
  console.error(`usage: npm run pack:<name>  |  npm run pack -- <name> [extra globs]\nnames: ${Object.keys(PRESETS).join(', ')}`)
  process.exit(1)
}
mkdirSync('.repomix', { recursive: true })
const include = [...preset.include, ...extra].join(',')
const cmd = `npx repomix --include "${include}" -o .repomix/${name}.xml${preset.compress ? ' --compress' : ''}`
console.log(`> ${cmd}`)
execSync(cmd, { stdio: 'inherit' })
