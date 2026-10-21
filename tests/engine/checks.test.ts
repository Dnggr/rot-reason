// tests/engine/checks.test.ts — resolveCheck: d6 + attribute + trait bonus vs DC, seeded and replayable
import { describe, expect, it } from 'vitest'
import { resolveCheck, traitBonus } from '../../src/engine/checks'
import { d6 } from '../../src/engine/rng'
import { TRAIT_BONUS } from '../../src/story/traits'
import { makeState } from './fixtures'
describe('traitBonus', () => {
  it('sums the bonus of every trait for that attribute; unknown traits add 0', () => {
    expect(traitBonus(['Bruiser'], 'grit', TRAIT_BONUS)).toBe(2)
    expect(traitBonus(['Bruiser', 'Signal'], 'wits', TRAIT_BONUS)).toBe(1)
    expect(traitBonus(['Bruiser', 'Medic', 'toString'], 'heart', TRAIT_BONUS)).toBe(0)
    expect(traitBonus([], 'grit', TRAIT_BONUS)).toBe(0)
  })
})
describe('resolveCheck', () => {
  const s = makeState({ rng: 12345, attr: { grit: 2, wits: 3, heart: 1 }, traits: ['Bruiser'] })
  const roll = d6(s.rng)
  it('total = d6 + attribute + trait bonus, and it advances the rng by exactly one roll', () => {
    const r = resolveCheck('grit', 99, s, TRAIT_BONUS)
    expect(r.roll).toBe(roll.value)
    expect(r.bonus).toBe(2)
    expect(r.total).toBe(roll.value + 2 + 2)
    expect(r.state.rng).toBe(roll.rng)
    expect(s.rng).toBe(12345)
  })
  it('passes when total >= dc (ties pass) and fails below', () => {
    const total = roll.value + 2 + 2
    expect(resolveCheck('grit', total, s, TRAIT_BONUS).pass).toBe(true)
    expect(resolveCheck('grit', total + 1, s, TRAIT_BONUS).pass).toBe(false)
  })
  it('logs the roll in one greppable line', () => {
    const r = resolveCheck('wits', 8, s, TRAIT_BONUS)
    expect(r.log).toEqual([{ kind: 'FX', text: `check wits dc 8: d6=${roll.value} +3 +0 = ${roll.value + 3} ${roll.value + 3 >= 8 ? 'pass' : 'fail'}` }])
  })
  it('same seed gives the same result; both outcomes occur across seeds', () => {
    const at = (seed: number) => resolveCheck('wits', 7, makeState({ rng: seed }), TRAIT_BONUS)
    expect(at(99)).toEqual(at(99))
    const passes = Array.from({ length: 60 }, (_, i) => at(i).pass)
    expect(passes).toContain(true)
    expect(passes).toContain(false)
  })
})
