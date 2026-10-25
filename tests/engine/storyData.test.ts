// tests/engine/storyData.test.ts — the story data tables match HONOR.md §3 and the engine can use them
import { describe, expect, it } from 'vitest'
import { APPROVAL, SOCIAL } from '../../src/story/approval'
import { NPCS } from '../../src/story/characters'
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
describe('companion approval table', () => {
  it('is the HONOR.md §5 table at 5 trust per +', () => {
    expect(APPROVAL).toEqual({
      nora: { mercy: 10, share: 5, protect: 5, honest: 5, lie: -5, steal: -5, intimidate: -5, kill_surrender: -10, abandon: -5, sacrifice: 5 },
      brick: { share: 5, protect: 10, honest: 5, lie: -5, intimidate: 5, kill_surrender: -5, abandon: -10, sacrifice: 5 },
      juno: { mercy: 5, protect: 5, honest: 10, lie: -10, intimidate: -5, kill_surrender: -5, abandon: -5, sacrifice: 5 },
      hart: { mercy: 5, share: 5, lie: -5, steal: -10, intimidate: -5, kill_surrender: -10, abandon: -5, sacrifice: 10 },
      calloway: { mercy: -5, share: -5, honest: -5, lie: 5, steal: 5, intimidate: 5, abandon: 5 },
    })
  })
  it('names only known companions and known deed tags, with whole non-zero numbers', () => {
    for (const [id, row] of Object.entries(APPROVAL)) {
      expect(Object.keys(NPCS)).toContain(id)
      for (const [tag, n] of Object.entries(row)) {
        expect(Object.keys(DEEDS)).toContain(tag)
        expect(Number.isInteger(n) && n !== 0).toBe(true)
      }
    }
  })
  it('walk-out line is the conflict threshold (trust -30), held by compliance (fear 60)', () => {
    expect(SOCIAL).toMatchObject({ leaveTrust: -30, fearHolds: 60 })
    expect(SOCIAL.approval).toBe(APPROVAL)
  })
})
