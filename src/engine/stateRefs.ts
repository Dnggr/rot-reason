// engine/stateRefs.ts — does a GameState only point at things this story has? Scenes, background, flags, chapter, met, owed keys, npc table (D33). Pure; the shape is stateSchema's job.
import { chapterOf, findScene, isSys } from './ids'
import type { GameState, Story } from './types'
const has = (table: Readonly<Record<string, unknown>>, id: string): boolean => Object.hasOwn(table, id)
const repeated = (xs: readonly string[]): string | undefined => xs.find((x, i) => xs.indexOf(x) !== i)
// The first thing the save points at that the story does not have, as a sentence; undefined when every reference holds.
export function refProblem(s: GameState, story: Story): string | undefined {
  const chapters = new Set(Object.keys(story.scenes).filter((id) => !isSys(id)).map(chapterOf))
  const here = findScene(story, s.scene)
  if (here === undefined) return `scene ${s.scene} is not in the story`
  // An echo scene plays inside the chapter that fired it (flow.advance), and the sys scenes inside whichever chapter the player was in, so only a plain scene must match.
  if (isSys(s.scene) || here.tags?.includes('echo') === true) { if (!chapters.has(s.chapter)) return `chapter ${s.chapter} is not in the story` }
  else if (s.chapter !== chapterOf(s.scene)) return `chapter ${s.chapter} does not match scene ${s.scene}`
  if (!has(story.backgrounds, s.bg)) return `background ${s.bg} is not in the story`
  const flag = Object.keys(s.flags).find((f) => !has(story.flags, f))
  if (flag !== undefined) return `flag ${flag} is not in the story`
  const echo = s.echoes.find((e) => findScene(story, e.scene) === undefined)
  if (echo !== undefined) return `echo scene ${echo.scene} is not in the story`
  if (s.resume !== null && findScene(story, s.resume) === undefined) return `resume scene ${s.resume} is not in the story`
  const dup = repeated(s.met)
  if (dup !== undefined) return `met lists ${dup} twice`
  const stranger = s.met.find((m) => !has(story.npcs, m))
  if (stranger !== undefined) return `met ${stranger} is not an npc of the story`
  const loose = [...Object.keys(s.owed), ...Object.keys(s.owedTags)].find((k) => !s.secrets.includes(k))
  if (loose !== undefined) return `owed honor for ${loose}, a secret that is not held`
  const secret = repeated(s.secrets)
  if (secret !== undefined) return `secret ${secret} is held twice`
  const ghost = Object.keys(s.npc).find((n) => !has(story.npcs, n))
  if (ghost !== undefined) return `npc ${ghost} is not in the story`
  const missing = Object.keys(story.npcs).find((n) => !has(s.npc, n))
  if (missing !== undefined) return `npc table has no entry for ${missing}`
  return undefined
}
