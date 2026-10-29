// debug/forceRoll.ts — which d6 face makes a check pass or fail, mirroring engine/checks.resolveCheck (total = d6 + attribute + trait bonus, pass when total >= dc)
import { heldTraits, traitBonus, type Perks } from '../engine/checks'
import type { Check, GameState, TraitBonuses } from '../engine/types'
export type Want = 'pass' | 'fail'
// undefined when no face can give that result (a pass needing 7+, a fail when every face passes).
export function rollFor(want: Want, check: Check, state: GameState, table: TraitBonuses, perks: Perks = {}): number | undefined {
  const need = check.dc - state.attr[check.attr] - traitBonus(heldTraits(state, perks), check.attr, table) // the lowest face that passes
  if (want === 'pass') return need > 6 ? undefined : Math.max(1, need)
  return need <= 1 ? undefined : Math.min(6, need - 1) // the highest face that fails
}