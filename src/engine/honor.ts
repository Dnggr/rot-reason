// engine/honor.ts — tiers, deeds (witness rule, diminishing returns, scene cap) and secret surfacing (HONOR.md §3, §8)
import { clamp, HONOR_RANGE } from './bounds'
import { trimDeeds } from './deeds'
import { line, signed, type Applied } from './log'
import type { DeedRecord, DeedTable, GameState, Tier } from './types'
export const TIER_ORDER: readonly Tier[] = ['T1', 'T2', 'T3', 'T4', 'T5']
export const SCENE_CAP = 25
export type Scale = 0.5 | 1 | 2
const REPEAT_FACTOR = [1, 0.5, 0.25] // 1st, 2nd, 3rd+ use of the same tag in one chapter
export const repeatFactor = (count: number): number => REPEAT_FACTOR[Math.min(count, 2)] ?? 0.25
export function tierOf(honor: number): Tier {
  if (honor <= -61) return 'T1'
  if (honor <= -21) return 'T2'
  if (honor <= 20) return 'T3'
  if (honor <= 60) return 'T4'
  return 'T5'
}
export const roundAway = (n: number): number => Math.sign(n) * Math.round(Math.abs(n)) + 0 // halves round away from zero; +0 drops -0
// Applies one tagged deed. Unwitnessed: half now, the rest goes back as `owed` (stored per secret by effects.applyAll).
export function applyDeed(state: GameState, tag: string, witnessed: boolean, scale: Scale, deeds: DeedTable): Applied {
  if (!Object.hasOwn(deeds, tag)) return { state, log: [line('ERROR', `unknown deed tag ${tag}`)] }
  const count = state.deedCount[tag] ?? 0
  const factor = repeatFactor(count)
  const full = roundAway((deeds[tag] ?? 0) * factor * scale)
  const now = witnessed ? full : roundAway(full / 2)
  const honor = clamp(state.honor + now, HONOR_RANGE)
  const next: GameState = { ...state, honor, deedCount: { ...state.deedCount, [tag]: count + 1 } }
  const text = `${signed(now)} ${tag} ${witnessed ? 'witnessed' : 'unseen'} -> ${honor}`
  return { state: next, log: [line('HONOR', text)], deed: { tag, witnessed, factor }, ...(full !== now ? { owed: full - now } : {}) }
}
// Net honor change in one scene is clamped to ±SCENE_CAP: call with the honor value from before the scene's effects. `prior` is the deed list from before them: the deeds the scene added are then trimmed by what the cap took (D31); without it the list is left alone.
export function capScene(before: number, state: GameState, prior: readonly DeedRecord[] = state.deeds): Applied {
  const honor = clamp(state.honor, [before - SCENE_CAP, before + SCENE_CAP])
  if (honor === state.honor) return { state, log: [] }
  return { state: { ...state, honor, deeds: trimDeeds(state.deeds, honor - state.honor, prior) }, log: [line('HONOR', `scene cap ±${SCENE_CAP} -> ${honor}`)] }
}
// A held secret comes out: the honor it owes applies now, and what it hid is forgotten. The trust hit is the party's reaction to the hidden deeds (effects.ts, relations.react, D29).
export function surface(state: GameState, id: string): Applied {
  if (!state.secrets.includes(id)) return { state, log: [line('ERROR', `reveal of a secret that is not held: ${id}`)] }
  const owed = { ...state.owed }
  const owedTags = { ...state.owedTags }
  const due = owed[id] ?? 0
  delete owed[id]
  delete owedTags[id]
  const honor = clamp(state.honor + due, HONOR_RANGE)
  const log = [line('SECRET', `reveal ${id}`)]
  if (due !== 0) log.push(line('HONOR', `${signed(due)} ${id} surfaced -> ${honor}`))
  return { state: { ...state, secrets: state.secrets.filter((s) => s !== id), owed, owedTags, honor }, log }
}
