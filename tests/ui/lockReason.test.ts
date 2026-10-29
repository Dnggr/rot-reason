// tests/ui/lockReason.test.ts — locked-choice wording derived from the lock condition (D20); flags and nested conditions stay generic
import { describe, expect, it } from 'vitest'
import type { Condition } from '../../src/engine/types'
import { describeLock } from '../../src/ui/lockReason'
const cases: [Condition, string][] = [
  [['trait', 'Medic'], 'Needs Medic'],
  [['honor', '>=', 21], 'Honor 21+'],
  [['honor', '>', 20], 'Honor 21+'],
  [['honor', '<=', -21], 'Honor -21 or lower'],
  [['honor', '<', 0], 'Honor -1 or lower'],
  [['honor', '==', 5], 'Honor 5'],
  [['stat', 'reason', '>=', 20], 'Reason 20+'],
  [['attr', 'wits', '>=', 3], 'Wits 3+'],
  [['res', 'meds', '>=', 1], 'Meds 1+'],
  [['day', '>=', 5], 'Day 5+'],
  [['tier', '>=', 'T4'], 'Respected or higher'],
  [['tier', '>', 'T3'], 'Respected or higher'],
  [['tier', '<=', 'T2'], 'Feared or lower'],
  [['tier', '<', 'T3'], 'Feared or lower'],
  [['tier', '==', 'T3'], 'Unknown'],
  [['tier', '>', 'T5'], 'Locked'], // no tier above T5
  [['tier', '<', 'T1'], 'Locked'], // no tier below T1
  [['trust', 'nora', '>=', 30], "Needs Nora's trust"],
  [['trust', 'nora', '<', 0], 'Locked'],
  [['fear', 'brick', '>', 10], 'Brick must fear you'],
  [['fear', 'brick', '<=', 10], 'Locked'],
  [['party', 'nora'], 'Needs Nora with you'],
  [['alive', 'juno'], 'Juno must be alive'],
  [['flag', 'found_key'], 'Locked'], // a flag name would spoil
  [['secret', 'stolen_meds'], 'Locked'],
  [['bg', 'dockworker'], 'Locked'],
  [{ all: [['trait', 'Medic'], ['honor', '>=', 5]] }, 'Locked'],
  [{ any: [['trait', 'Medic']] }, 'Locked'],
  [{ not: ['party', 'nora'] }, 'Locked'],
]
describe('describeLock', () => {
  it.each(cases)('%j -> %s', (cond, text) => {
    expect(describeLock(cond)).toBe(text)
  })
})