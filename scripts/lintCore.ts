// scripts/lintCore.ts — lintStory: schema check per scene, duplicate ids, then the graph, reference, party and tone checks (STORY_FORMAT §8)
import { sceneSchema } from '../src/engine/schema'
import type { Scene, StoryTables } from '../src/engine/types'
import { buildStoryFrom } from './lintBuild'
import { lintGraph } from './lintGraph'
import { lintParty } from './lintParty'
import { lintRefs } from './lintRefs'
import { lintTone } from './lintTone'
export interface LintResult {
  errors: string[]
  warnings: string[]
}
// `chapters` maps a chapter file name to its raw (unchecked) scenes; `system` are the engine's fallback scenes.
export function lintStory(chapters: Record<string, readonly unknown[]>, system: readonly unknown[], tables: StoryTables, flags: Readonly<Record<string, string>>): LintResult {
  const errors: string[] = []
  const warnings: string[] = []
  const ids = new Set<string>()
  const valid: Scene[] = []
  for (const [name, raw] of Object.entries({ system, ...chapters })) {
    raw.forEach((item, i) => {
      const r = sceneSchema.safeParse(item)
      const label = `${name}[${i}]`
      if (!r.success) return void errors.push(`${label}: ${r.error.issues.map((x) => `${x.path.length > 0 ? `${x.path.join('.')} ` : ''}${x.message}`).join('; ')}`)
      if (ids.has(r.data.id)) errors.push(`duplicate scene id: ${r.data.id} (in ${name})`)
      if (!r.data.id.includes('.')) errors.push(`${label}: scene id ${r.data.id} must look like <chapter>.<name>`)
      ids.add(r.data.id)
      valid.push(r.data)
    })
  }
  const story = buildStoryFrom(valid, tables)
  lintGraph(story, errors)
  lintRefs(story, flags, errors, warnings)
  lintParty(story, warnings)
  lintTone(story, errors, warnings)
  return { errors, warnings }
}
