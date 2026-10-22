// engine/choices.ts — what the player can do with a choice: hidden (if), locked (lock), broke (cost) or open
import { evaluate } from './conditions'
import type { Choice, GameState, ResKey } from './types'
export type ChoiceStatus = 'hidden' | 'locked' | 'broke' | 'open'
export const RES_KEYS: readonly ResKey[] = ['food', 'ammo', 'meds']
// `if` decides whether the choice is shown; `lock` is the condition to ENABLE it; `cost` must be affordable.
export function status(c: Choice, s: GameState): ChoiceStatus {
  if (c.if !== undefined && !evaluate(c.if, s)) return 'hidden'
  if (c.lock !== undefined && !evaluate(c.lock, s)) return 'locked'
  return RES_KEYS.some((k) => s.res[k] < (c.cost?.[k] ?? 0)) ? 'broke' : 'open'
}
