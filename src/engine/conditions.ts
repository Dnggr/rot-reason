// engine/conditions.ts — evaluate(cond, state): the closed condition vocabulary (STORY_FORMAT §4)
import { TIER_ORDER, tierOf } from './honor'
import type { Cmp, Condition, GameState, NpcState } from './types'
export function compare(a: number, op: Cmp, b: number): boolean {
  switch (op) {
    case '>=': return a >= b
    case '<=': return a <= b
    case '>': return a > b
    case '<': return a < b
    case '==': return a === b
  }
}
export function npcOf(state: GameState, id: string): NpcState | undefined {
  return Object.hasOwn(state.npc, id) ? state.npc[id] : undefined
}
// Unknown ids read as false / 0 (the linter rejects them at author time). `secret` is true while the secret is held, not yet revealed.
export function evaluate(c: Condition, s: GameState): boolean {
  if ('all' in c) return c.all.every((x) => evaluate(x, s))
  if ('any' in c) return c.any.some((x) => evaluate(x, s))
  if ('not' in c) return !evaluate(c.not, s)
  switch (c[0]) {
    case 'flag': return s.flags[c[1]] === true
    case 'honor': return compare(s.honor, c[1], c[2])
    case 'tier': return compare(TIER_ORDER.indexOf(tierOf(s.honor)), c[1], TIER_ORDER.indexOf(c[2]))
    case 'res': return compare(s.res[c[1]], c[2], c[3])
    case 'stat': return compare(s.stats[c[1]], c[2], c[3])
    case 'attr': return compare(s.attr[c[1]], c[2], c[3])
    case 'trait': return s.traits.includes(c[1])
    case 'alive': return npcOf(s, c[1])?.alive === true
    case 'party': return s.party.includes(c[1])
    case 'trust': return compare(npcOf(s, c[1])?.trust ?? 0, c[2], c[3])
    case 'fear': return compare(npcOf(s, c[1])?.fear ?? 0, c[2], c[3])
    case 'bg': return s.bg === c[1]
    case 'day': return compare(s.day, c[1], c[2])
    case 'secret': return s.secrets.includes(c[1])
    default: throw new Error(`conditions: unknown kind ${JSON.stringify(c)}`)
  }
}