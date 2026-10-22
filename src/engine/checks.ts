// engine/checks.ts — resolveCheck: seeded d6 + attribute + trait bonus vs DC (GAME_DESIGN §4); the bonus table is injected
import { line, type LogLine } from './log'
import { d6 } from './rng'
import type { AttrKey, GameState, TraitBonuses } from './types'
export interface CheckResult {
  state: GameState // rng advanced by one roll
  log: LogLine[]
  roll: number
  bonus: number
  total: number
  dc: number
  pass: boolean
}
export type Odds = 'risky' | 'even' | 'likely'
export function traitBonus(traits: readonly string[], attr: AttrKey, table: TraitBonuses): number {
  return traits.reduce((sum, t) => sum + (Object.hasOwn(table, t) ? (table[t]?.[attr] ?? 0) : 0), 0)
}
export function resolveCheck(attr: AttrKey, dc: number, state: GameState, table: TraitBonuses): CheckResult {
  const r = d6(state.rng)
  const bonus = traitBonus(state.traits, attr, table)
  const total = r.value + state.attr[attr] + bonus
  const pass = total >= dc
  const text = `check ${attr} dc ${dc}: d6=${r.value} +${state.attr[attr]} +${bonus} = ${total} ${pass ? 'pass' : 'fail'}`
  return { state: { ...state, rng: r.rng }, log: [line('FX', text)], roll: r.value, bonus, total, dc, pass }
}
// The odds as a word (GAME_DESIGN §4): the d6 wins on `wins` of 6 faces; risky <= 2, likely >= 4, else even.
export function checkOdds(attr: AttrKey, dc: number, state: GameState, table: TraitBonuses): Odds {
  const need = dc - state.attr[attr] - traitBonus(state.traits, attr, table)
  const wins = Math.min(6, Math.max(0, 7 - need))
  return wins <= 2 ? 'risky' : wins >= 4 ? 'likely' : 'even'
}
