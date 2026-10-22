// story/index.ts — assembles the Story the engine runs: chapters + system scenes + data tables
import type { Scene, Story, StoryTables } from '../engine/types'
import { BACKGROUNDS } from './backgrounds'
import { chapters } from './chapters/index'
import { NPCS } from './characters'
import { ENDINGS } from './endings'
import { DEEDS } from './honor'
import { SYSTEM_SCENES } from './system'
import { TRAIT_BONUS } from './traits'
export const START_SCENE = 't.wake' // M4 changes this to the Prologue's first scene
export const TABLES: StoryTables = { start: START_SCENE, deeds: DEEDS, traitBonus: TRAIT_BONUS, backgrounds: BACKGROUNDS, npcs: NPCS, endings: ENDINGS }
export function buildStory(scenes: readonly Scene[]): Story {
  return { ...TABLES, scenes: Object.fromEntries(scenes.map((s) => [s.id, s])) }
}
export async function loadStory(): Promise<Story> {
  const mods = await Promise.all(Object.values(chapters).map((load) => load()))
  return buildStory([...SYSTEM_SCENES, ...mods.flatMap((m) => m.scenes)])
}
