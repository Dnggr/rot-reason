// engine/deeds.ts — the Journal's deed list (HONOR §7, D30): add a record (the last DEED_KEEP are kept), find which companions' trust moved between two states, and give the scene cap's correction back to the deeds it cut (D31)
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
// The scene cap took honor off a run of deeds: `back` is what it gave back (negative when deeds raised honor, positive when they lowered it). The newest deeds of this scene that moved honor the other way absorb it, so the list adds up to what the meter did (HONOR §7, D31).
// Only records that are not in `prior` (the list when the scene began) may change, and a deed never flips sign: it can drop to 0 ("No change") and no further.
export function trimDeeds(deeds: readonly DeedRecord[], back: number, prior: readonly DeedRecord[]): DeedRecord[] {
  const out = [...deeds]
  const old = new Set(prior)
  let left = back
  for (let i = out.length - 1; i >= 0 && left !== 0; i--) {
    const d = out[i]
    if (d === undefined || old.has(d)) break // everything before this is from an earlier scene
    if (d.delta === 0 || Math.sign(d.delta) === Math.sign(left)) continue
    const take = Math.sign(left) * Math.min(Math.abs(left), Math.abs(d.delta))
    out[i] = { ...d, delta: d.delta + take }
    left -= take
  }
  return out
}
