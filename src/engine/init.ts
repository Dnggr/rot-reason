// engine/init.ts — startGame: the first GameState for a background, name and seed (the START action)
import { enter } from './flow'
import { chapterOf } from './ids'
import { line, type Applied } from './log'
import { initRng } from './rng'
import type { GameState, Story } from './types'
export const SAVE_VERSION = 3 // v2 (M3 s1, D29): GameState.owedTags; v3 (M3 s2, D30): GameState.deeds
// Throws on an unknown background (the reducer turns a throw into an ERROR log plus sys.error).
export function startGame(story: Story, bg: string, name: string, seed: number): Applied {
  const b = Object.hasOwn(story.backgrounds, bg) ? story.backgrounds[bg] : undefined
  if (b === undefined) throw new Error(`unknown background ${bg}`)
  const npc = Object.fromEntries(Object.entries(story.npcs).map(([id, n]) => [id, { alive: true, trust: n.trust, fear: n.fear }]))
  const state: GameState = {
    v: SAVE_VERSION, seed, rng: initRng(seed), name, scene: story.start, chapter: chapterOf(story.start), day: 1, phase: 'dawn',
    stats: { ...b.stats }, res: { ...b.res }, attr: { ...b.attr }, bg, traits: [b.trait], honor: 0, flags: {}, secrets: [], owed: {}, owedTags: {},
    party: [], deeds: [], npc, echoes: [], deedCount: {}, history: [], log: [], resume: null,
  }
  const r = enter(state, story.start, story)
  return { state: r.state, log: [line('FX', `new game ${bg} seed ${seed}`), ...r.log] }
}
