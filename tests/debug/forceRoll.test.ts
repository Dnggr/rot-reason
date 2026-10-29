// tests/debug/forceRoll.test.ts — rollFor agrees with the engine: the face it names really passes (or fails) resolveCheck, and "impossible" really is
import { describe, expect, it } from 'vitest'
import { resolveCheck } from '../../src/engine/checks'
import { rngForRoll } from '../../src/engine/debug'
import type { AttrKey, Check } from '../../src/engine/types'
import { rollFor } from '../../src/debug/forceRoll'
import { makeState } from '../engine/fixtures'
const table = { Bruiser: { grit: 2 } }
const check = (attr: AttrKey, dc: number): Check => ({ attr, dc, pass: { to: 'x' }, fail: { to: 'y' } })
// what resolveCheck gives when the d6 shows `face`
const outcome = (face: number, c: Check, traits: string[]): boolean => resolveCheck(c.attr, c.dc, makeState({ rng: rngForRoll(1, face) ?? 0, traits }), table).pass
describe('rollFor', () => {
  it('names the lowest passing and the highest failing face', () => {
    const s = makeState({ attr: { grit: 2, wits: 3, heart: 1 } })
    expect(rollFor('pass', check('grit', 6), s, table)).toBe(4) // 4 + 2 = 6
    expect(rollFor('fail', check('grit', 6), s, table)).toBe(3)
  })
  it('counts the trait bonus', () => {
    const s = makeState({ traits: ['Bruiser'] }) // grit 2 + 2
    expect(rollFor('pass', check('grit', 6), s, table)).toBe(2)
    expect(rollFor('fail', check('grit', 6), s, table)).toBe(1)
  })
  it('says undefined when no face can do it', () => {
    const s = makeState()
    expect(rollFor('pass', check('heart', 9), s, table)).toBeUndefined() // needs 8
    expect(rollFor('fail', check('wits', 2), s, table)).toBeUndefined() // every face passes
  })
  it('matches resolveCheck for every attribute, dc and trait set', () => {
    for (const traits of [[], ['Bruiser']]) {
      for (const attr of ['grit', 'wits', 'heart'] as const) {
        for (let dc = 1; dc <= 12; dc++) {
          const c = check(attr, dc)
          const s = makeState({ traits })
          const pass = rollFor('pass', c, s, table)
          const fail = rollFor('fail', c, s, table)
          if (pass !== undefined) expect(outcome(pass, c, traits)).toBe(true)
          else for (let f = 1; f <= 6; f++) expect(outcome(f, c, traits)).toBe(false)
          if (fail !== undefined) expect(outcome(fail, c, traits)).toBe(false)
          else for (let f = 1; f <= 6; f++) expect(outcome(f, c, traits)).toBe(true)
        }
      }
    }
  })
})