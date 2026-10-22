// engine/endings.ts — resolveEnding: the first matching rule wins (STORYBOARD §4); fixed ending ids
import { evaluate } from './conditions'
import type { EndingRule, GameState } from './types'
export const AUTO_ENDING = 'auto' // a scene with end: 'auto' asks the resolver
export const DEATH_ENDING = 'death' // sys.death
export const SYS_ENDING = 'sys_error' // fallback scenes; the UI shows the error screen
export function resolveEnding(state: GameState, rules: readonly EndingRule[]): string {
  for (const r of rules) if (r.if === undefined || evaluate(r.if, state)) return r.id
  return SYS_ENDING
}
// Ending ids a scene may name: the rule ids plus the fixed ones.
export function endingIds(rules: readonly EndingRule[]): string[] {
  return [AUTO_ENDING, DEATH_ENDING, SYS_ENDING, ...rules.map((r) => r.id)]
}
