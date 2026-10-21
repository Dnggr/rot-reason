// scripts/lint-story.ts — story linter. M0: loads the registry and reports counts. Graph/flag checks arrive in M1.
import { chapters } from '../src/story/chapters/index'

async function main(): Promise<void> {
  const errors: string[] = []
  const ids = new Set<string>()
  let count = 0

  for (const [name, load] of Object.entries(chapters)) {
    const { scenes } = await load()
    for (const s of scenes) {
      count++
      if (ids.has(s.id)) errors.push(`duplicate scene id: ${s.id} (in ${name})`)
      ids.add(s.id)
    }
  }

  if (errors.length > 0) {
    for (const e of errors) console.error(`lint:story ERROR ${e}`)
    process.exit(1)
  }
  console.log(`lint:story ok: ${Object.keys(chapters).length} chapters, ${count} scenes, 0 errors`)
}

void main()
