// tests/ui/vitals.test.ts — the low-vitals thresholds: HP in its last two points, Reason under the glitch line
import { describe, expect, it } from 'vitest'
import { GLITCH_BELOW } from '../../src/engine/select'
import { isLowHp, isLowReason, LOW_HP } from '../../src/ui/vitals'
const stats = (hp: number, reason: number) => ({ hp, reason, rot: 0 })
describe('vitals', () => {
  it('low HP is the last two points', () => {
    expect(LOW_HP).toBe(2)
    expect([5, 4, 3, 2, 1].map((hp) => isLowHp(stats(hp, 80)))).toEqual([false, false, false, true, true])
  })
  it('low Reason starts where the engine swaps in the glitch text', () => {
    expect(isLowReason(stats(5, GLITCH_BELOW))).toBe(false)
    expect(isLowReason(stats(5, GLITCH_BELOW - 1))).toBe(true)
  })
})