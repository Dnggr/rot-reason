// tests/engine/storyData.test.ts — the story data tables match HONOR.md §3 and the engine can use them
import { describe, expect, it } from 'vitest'
import { DEEDS } from '../../src/story/honor'
import { TRAIT_BONUS } from '../../src/story/traits'
describe('deed table', () => {
  it('has the HONOR.md §3 deltas', () => {
    expect(DEEDS).toEqual({
      mercy: 5, share: 5, protect: 8, sacrifice: 12, keep_word: 6, honest: 2, lie: -3, lie_harm: -6, steal: -6, abandon: -10,
      kill_surrender: -12, betray: -15, torture: -15, murder: -20, intimidate: -4, cruelty_show: -8,
    })
  })
  it('every delta is a non-zero integer within one scene cap', () => {
    for (const d of Object.values(DEEDS)) {
      expect(Number.isInteger(d)).toBe(true)
      expect(d).not.toBe(0)
      expect(Math.abs(d)).toBeLessThanOrEqual(25)
    }
  })
})
describe('trait bonuses', () => {
  it('only lists attributes that exist and positive numbers', () => {
    for (const bonus of Object.values(TRAIT_BONUS)) {
      for (const [attr, n] of Object.entries(bonus)) {
        expect(['grit', 'wits', 'heart']).toContain(attr)
        expect(n).toBeGreaterThan(0)
      }
    }
  })
})
