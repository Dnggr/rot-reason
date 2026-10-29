// tests/engine/bounds.test.ts — clamp: ranges per value, and the NaN/Infinity guard
import { describe, expect, it } from 'vitest'
import { clamp, DAY_RANGE, FEAR_RANGE, HONOR_RANGE, RES_RANGE, STAT_RANGE, TRUST_RANGE } from '../../src/engine/bounds'
describe('bounds', () => {
  it('clamps to both ends and keeps in-range values', () => {
    expect(clamp(7, STAT_RANGE.hp)).toBe(5)
    expect(clamp(-1, STAT_RANGE.hp)).toBe(0)
    expect(clamp(40, STAT_RANGE.reason)).toBe(40)
    expect(clamp(120, HONOR_RANGE)).toBe(100)
    expect(clamp(-120, TRUST_RANGE)).toBe(-100)
  })
  it('uses the documented ranges', () => {
    expect([STAT_RANGE.rot, RES_RANGE, FEAR_RANGE, DAY_RANGE]).toEqual([[0, 100], [0, 9], [0, 100], [1, 21]])
  })
  it('throws on NaN and Infinity instead of storing them', () => {
    expect(() => clamp(Number.NaN, HONOR_RANGE)).toThrow(RangeError)
    expect(() => clamp(Number.POSITIVE_INFINITY, HONOR_RANGE)).toThrow(RangeError)
  })
})