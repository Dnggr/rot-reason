// scripts/lint-story.ts — story linter CLI: schema, graph and reference checks over every chapter (STORY_FORMAT §8). Exits 1 on any error.
import { chapters } from '../src/story/chapters/index'
import { FLAGS } from '../src/story/flags'
import { TABLES } from '../src/story/index'
import { SYSTEM_SCENES } from '../src/story/system'
import { lintStory } from './lintCore'
async function main(): Promise<void> {
  const loaded: Record<string, readonly unknown[]> = {}
  for (const [name, load] of Object.entries(chapters)) loaded[name] = (await load()).scenes
  const { errors, warnings } = lintStory(loaded, SYSTEM_SCENES, TABLES, FLAGS)
  for (const w of warnings) console.warn(`lint:story WARN ${w}`)
  if (errors.length > 0) {
    for (const e of errors) console.error(`lint:story ERROR ${e}`)
    process.exit(1)
  }
  const count = Object.values(loaded).reduce((n, list) => n + list.length, 0)
  console.log(`lint:story ok: ${Object.keys(loaded).length} chapters, ${count} scenes, 0 errors, ${warnings.length} warnings`)
}
void main()
