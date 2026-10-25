// engine/relations.ts — trust and fear shifts, party join / leave, companion approval of deeds, the walk-out rule (HONOR §5-6, D29); the approval table is injected, never imported (D14)
import { clamp, TRUST_RANGE, type Range } from './bounds'
import { npcOf } from './conditions'
import { roundAway } from './honor'
import { line, signed, type Applied, type LogLine } from './log'
import type { GameState, Social } from './types'
export const PARTY_MAX = 3
// No table: nobody approves of anything and nobody walks out (-101 is under the trust floor, and fear is never under 0).
export const NO_SOCIAL: Social = { approval: {}, leaveTrust: -101, fearHolds: 0 }
const ok = (state: GameState, text: string): Applied => ({ state, log: [line('FX', text)] })
const fail = (state: GameState, text: string): Applied => ({ state, log: [line('ERROR', text)] })
export function shift(s: GameState, id: string, key: 'trust' | 'fear', delta: number, range: Range): Applied {
  const n = npcOf(s, id)
  if (n === undefined) return fail(s, `${key} ${id}: unknown npc`)
  const v = clamp(n[key] + delta, range)
  return ok({ ...s, npc: { ...s.npc, [id]: { ...n, [key]: v } } }, `${key} ${id} ${signed(delta)} -> ${v}`)
}
// '+id' / '-id' lists (party, traits): returns the new list, or undefined when the sign is missing
export function signedList(list: readonly string[], spec: string): string[] | undefined {
  const name = spec.slice(1)
  if (spec.startsWith('+')) return list.includes(name) ? [...list] : [...list, name]
  if (spec.startsWith('-')) return list.filter((x) => x !== name)
  return undefined
}
// '+id' joins, '-id' leaves. A joiner must be a known npc who is alive; the party holds PARTY_MAX.
export function party(s: GameState, spec: string): Applied {
  const id = spec.slice(1)
  const next = signedList(s.party, spec)
  if (next === undefined) return fail(s, `party ${spec}: must start with + or -`)
  if (spec.startsWith('+')) {
    const n = npcOf(s, id)
    if (n === undefined) return fail(s, `party ${spec}: unknown npc`)
    if (!n.alive) return fail(s, `party ${spec}: ${id} is dead`)
  }
  if (next.length > PARTY_MAX) return fail(s, `party ${spec}: party is full (${PARTY_MAX})`)
  return ok({ ...s, party: next }, `party ${spec}`)
}
// Every companion in the party reacts to a deed by the approval table, scaled by the deed's repeat factor (HONOR §5). Zero or unlisted = no reaction.
export function react(s: GameState, tag: string, factor: number, social: Social): Applied {
  let cur = s
  const log: LogLine[] = []
  for (const id of s.party) {
    const row = Object.hasOwn(social.approval, id) ? social.approval[id] : undefined
    const base = row !== undefined && Object.hasOwn(row, tag) ? (row[tag] ?? 0) : 0
    const delta = roundAway(base * factor)
    const n = npcOf(cur, id)
    if (delta === 0 || n === undefined || !n.alive) continue
    const r = shift(cur, id, 'trust', delta, TRUST_RANGE)
    cur = r.state
    log.push(line('FX', `${id} reacts to ${tag}: trust ${signed(delta)} -> ${cur.npc[id]?.trust ?? n.trust}`))
  }
  return { state: cur, log }
}
// A companion walks out when trust is at or under the leave line and fear no longer holds them (HONOR §4: stay out of fear, leave when it fades).
export function walkouts(s: GameState, social: Social): Applied {
  let cur = s
  const log: LogLine[] = []
  for (const id of s.party) {
    const n = npcOf(cur, id)
    if (n === undefined || !n.alive || n.trust > social.leaveTrust || n.fear >= social.fearHolds) continue
    cur = { ...cur, party: cur.party.filter((x) => x !== id) }
    log.push(line('FX', `party -${id}: walked out (trust ${n.trust}, fear ${n.fear})`))
  }
  return { state: cur, log }
}
