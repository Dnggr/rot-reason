// engine/met.ts — who the player has met (D31): `meet` adds known npcs to GameState.met, `metIn` lists who a scene puts in front of the player (its `who` and the speakers of the beats that show)
import { evaluate } from './conditions'
import { glitches } from './select'
import type { GameState, Scene } from './types'
// Adds the ids that are registered npcs and not met yet, in order. Unknown ids are ignored (the linter rejects them); nobody new returns the same state.
export function meet(s: GameState, ids: readonly string[]): GameState {
  const fresh = [...new Set(ids)].filter((id) => Object.hasOwn(s.npc, id) && !s.met.includes(id))
  return fresh.length === 0 ? s : { ...s, met: [...s.met, ...fresh] }
}
// Everyone a scene shows: `who`, plus every `say` speaker whose beat passes its condition now. While the `glitch` text shows, the beats are hidden, so only `who` counts (M3 s8, D36).
export function metIn(scene: Scene, s: GameState): string[] {
  if (glitches(scene, s)) return [...(scene.who ?? [])]
  const beats = typeof scene.text === 'string' ? [] : scene.text
  const speakers = beats.flatMap((b) => (typeof b !== 'string' && 'say' in b && (b.if === undefined || evaluate(b.if, s)) ? [b.say] : []))
  return [...(scene.who ?? []), ...speakers]
}