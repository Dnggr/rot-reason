// tests/engine/conditions.test.ts — every condition kind, every operator, combinators, unknown ids
import { describe, expect, it } from 'vitest'
import { compare, evaluate, npcOf } from '../../src/engine/conditions'
import type { Condition } from '../../src/engine/types'
import { makeState } from './fixtures'
const s = makeState({
  honor: 30, flags: { route_church: true }, traits: ['Medic'], secrets: ['hart_wife'], party: ['nora'], day: 10, bg: 'mechanic',
  stats: { hp: 3, reason: 25, rot: 0 }, res: { food: 2, ammo: 0, meds: 1 },
  npc: { nora: { alive: true, trust: 30, fear: 0 }, vera: { alive: false, trust: -20, fear: 45 } },
})
const yes = (c: Condition) => expect(evaluate(c, s)).toBe(true)
const no = (c: Condition) => expect(evaluate(c, s)).toBe(false)
describe('conditions', () => {
  it('compare handles all five operators', () => {
    expect([compare(2, '>=', 2), compare(2, '<=', 1), compare(2, '>', 1), compare(1, '<', 1), compare(3, '==', 3)]).toEqual([true, false, true, false, true])
  })
  it('flag, trait, party, bg, secret', () => {
    yes(['flag', 'route_church']); no(['flag', 'nope'])
    yes(['trait', 'Medic']); no(['trait', 'Hauler'])
    yes(['party', 'nora']); no(['party', 'brick'])
    yes(['bg', 'mechanic']); no(['bg', 'teacher'])
    yes(['secret', 'hart_wife']); no(['secret', 'other'])
  })
  it('honor, day, stat, res, attr compare numbers', () => {
    yes(['honor', '>=', 21]); no(['honor', '>', 30]); yes(['day', '>=', 10]); no(['day', '<', 10])
    yes(['stat', 'reason', '<', 30]); no(['stat', 'hp', '==', 5]); yes(['res', 'food', '>=', 2]); no(['res', 'ammo', '>', 0])
    yes(['attr', 'wits', '>=', 3]); no(['attr', 'grit', '>', 2])
  })
  it('tier compares in tier order', () => {
    yes(['tier', '==', 'T4']); yes(['tier', '>=', 'T3']); no(['tier', '>=', 'T5']); yes(['tier', '<', 'T5'])
    expect(evaluate(['tier', '<=', 'T2'], makeState({ honor: -50 }))).toBe(true)
  })
  it('alive, trust, fear read the npc; unknown npcs are false / 0', () => {
    yes(['alive', 'nora']); no(['alive', 'vera']); no(['alive', 'ghost'])
    yes(['trust', 'nora', '>=', 30]); yes(['fear', 'vera', '>=', 40]); yes(['trust', 'ghost', '==', 0]); no(['fear', 'ghost', '>', 0])
    expect(npcOf(s, 'constructor')).toBeUndefined()
  })
  it('all / any / not combine and nest', () => {
    yes({ all: [['flag', 'route_church'], ['party', 'nora']] }); no({ all: [['flag', 'route_church'], ['party', 'brick']] })
    yes({ any: [['party', 'brick'], ['alive', 'nora']] }); no({ any: [['party', 'brick'], ['flag', 'nope']] })
    yes({ not: ['flag', 'nope'] }); yes({ not: { any: [['party', 'brick'], ['bg', 'teacher']] } })
    yes({ all: [{ any: [['day', '>', 99], ['trait', 'Medic']] }, { not: ['secret', 'other'] }] })
  })
  it('an unknown kind throws instead of guessing', () => {
    expect(() => evaluate(['bogus', 'x'] as unknown as Condition, s)).toThrow(/unknown kind/)
  })
})
