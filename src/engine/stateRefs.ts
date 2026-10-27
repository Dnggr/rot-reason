// engine/stateRefs.ts — does a GameState only point at things this story has? Scenes, background, flags, chapters, npcs, deed tags, traits, history shape (D33, D34). Pure; the shape is stateSchema's job.
import { UNKNOWN_DEED } from './effects'
import { chapterOf, findScene, isSys } from './ids'
import type { GameState, Story } from './types'
const has = (table: Readonly<Record<string, unknown>>, id: string): boolean => Object.hasOwn(table, id)
const repeated = (xs: readonly string[]): string | undefined => xs.find((x, i) => xs.indexOf(x) !== i)
const STEP = /^.+:[abcd>]$/ // a history entry: "scene:choice" or "scene:>" (save.replay reads the same shape)
// The chapters that have a scene of their own (system scenes belong to none).
export const chaptersOf = (story: Story): Set<string> => new Set(Object.keys(story.scenes).filter((id) => !isSys(id)).map(chapterOf))
// Every trait id a state may hold: a background's trait, a check-bonus key or a companion perk (the same set `lint:story` allows, M3 s6).
export const knownTraits = (story: Story): Set<string> => new Set([...Object.values(story.backgrounds).map((b) => b.trait), ...Object.keys(story.traitBonus), ...Object.values(story.perks).map((p) => p.trait)])
// The first thing the save points at that the story does not have, as a sentence; undefined when every reference holds.
export function refProblem(s: GameState, story: Story): string | undefined {
  const chapters = chaptersOf(story)
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
  const late = s.echoes.find((e) => e.atChapter !== undefined && !chapters.has(e.atChapter))
  if (late !== undefined) return `echo ${late.scene} waits for chapter ${late.atChapter}, which has no scene`
  if (s.resume !== null && findScene(story, s.resume) === undefined) return `resume scene ${s.resume} is not in the story`
  const dup = repeated(s.met)
  if (dup !== undefined) return `met lists ${dup} twice`
  const stranger = s.met.find((m) => !has(story.npcs, m))
  if (stranger !== undefined) return `met ${stranger} is not an npc of the story`
  const unmet = s.party.find((p) => !s.met.includes(p))
  if (unmet !== undefined) return `party member ${unmet} is not in met`
  const loose = [...Object.keys(s.owed), ...Object.keys(s.owedTags)].find((k) => !s.secrets.includes(k))
  if (loose !== undefined) return `owed honor for ${loose}, a secret that is not held`
  const secret = repeated(s.secrets)
  if (secret !== undefined) return `secret ${secret} is held twice`
  const ghost = Object.keys(s.npc).find((n) => !has(story.npcs, n))
  if (ghost !== undefined) return `npc ${ghost} is not in the story`
  const missing = Object.keys(story.npcs).find((n) => !has(s.npc, n))
  if (missing !== undefined) return `npc table has no entry for ${missing}`
  return refProblemMore(s, story)
}
// The rest of the list: traits, deeds, deed counts, history (M3 s6, D34).
function refProblemMore(s: GameState, story: Story): string | undefined {
  const twice = repeated(s.traits)
  if (twice !== undefined) return `trait ${twice} is held twice`
  const trait = knownTraits(story)
  const alien = s.traits.find((t) => !trait.has(t))
  if (alien !== undefined) return `trait ${alien} is not a trait of the story`
  const tag = s.deeds.find((d) => d.tag !== UNKNOWN_DEED && !has(story.deeds, d.tag))
  if (tag !== undefined) return `deed ${tag.tag} is not a deed tag of the story`
  for (const d of s.deeds) {
    const who = Object.keys(d.who).find((n) => !has(story.npcs, n))
    if (who !== undefined) return `deed ${d.tag} names ${who}, who is not an npc of the story`
  }
  const count = Object.keys(s.deedCount).find((k) => !has(story.deeds, k))
  if (count !== undefined) return `deedCount counts ${count}, which is not a deed tag of the story`
  const i = s.history.findIndex((h) => !STEP.test(h))
  if (i !== -1) return `history entry ${i} (${JSON.stringify(s.history[i]?.slice(0, 40))}) is not "scene:choice"`
  return undefined
}
