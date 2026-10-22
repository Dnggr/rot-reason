// story/endings.ts — ending rules, first match wins (STORYBOARD §4). Lighthouse sits before the default so the default is last.
import type { Condition, EndingRule } from '../engine/types'
const ALLIES = ['nora', 'brick', 'juno', 'hart', 'calloway']
const ally = (id: string): Condition => ({ all: [['alive', id], ['trust', id, '>=', 30]] })
function combos(items: readonly Condition[], n: number): Condition[][] {
  if (n === 0) return [[]]
  return items.flatMap((c, i) => combos(items.slice(i + 1), n - 1).map((rest) => [c, ...rest]))
}
// "at least n of these": any of the n-sized combinations holds
const atLeast = (n: number, items: readonly Condition[]): Condition => ({ any: combos(items, n).map((all) => ({ all })) })
export const ENDINGS: readonly EndingRule[] = [
  { id: 'beacon', if: { all: [['honor', '>=', 61], ['flag', 'final_lead'], atLeast(3, ALLIES.map(ally))] } },
  { id: 'warden_of_the_dead', if: { all: [['honor', '<=', -61], ['flag', 'route_fear']] } },
  { id: 'broken_reason', if: ['stat', 'reason', '<', 20] },
  { id: 'rot_within', if: { any: [['stat', 'rot', '>=', 100], ['flag', 'nora_turned']] } },
  { id: 'lighthouse', if: { all: [['flag', 'final_stay'], ['flag', 'broadcast_changed'], ['alive', 'biscuit'], ['alive', 'juno']] } },
  { id: 'last_seat' },
]
