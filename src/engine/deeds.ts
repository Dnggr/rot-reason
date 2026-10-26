// engine/deeds.ts — the Journal's deed list (HONOR §7, D30): add a record (the last DEED_KEEP are kept) and find which companions' trust moved between two states
import type { DeedRecord, GameState } from './types'
export const DEED_KEEP = 20
export function addDeed(s: GameState, rec: DeedRecord): GameState {
  return { ...s, deeds: [...s.deeds, rec].slice(-DEED_KEEP) }
}
// The companions in the party before whose trust differs after: { id: change }. Nobody moved = {}.
export function reactors(before: GameState, after: GameState): Record<string, number> {
  const out: Record<string, number> = {}
  for (const id of before.party) {
    const d = (after.npc[id]?.trust ?? 0) - (before.npc[id]?.trust ?? 0)
    if (d !== 0) out[id] = d
  }
  return out
}
