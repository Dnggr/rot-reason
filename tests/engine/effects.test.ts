// tests/engine/effects.test.ts — every effect kind: result, clamping, bad input as ERROR log, applyAll secret pairing
import { describe, expect, it } from 'vitest'
import { apply, applyAll, PARTY_MAX } from '../../src/engine/effects'
import type { Effect } from '../../src/engine/types'
import { deeds, makeState } from './fixtures'
const run = (e: Effect, over = {}) => apply(e, makeState(over), deeds)
describe('apply: numbers', () => {
  it('stat and res add a delta and clamp to their ranges', () => {
    expect(run(['stat', 'hp', -2]).state.stats.hp).toBe(3)
    expect(run(['stat', 'hp', 4]).state.stats.hp).toBe(5)
    expect(run(['stat', 'reason', -200]).state.stats.reason).toBe(0)
    expect(run(['res', 'food', -1]).state.res.food).toBe(2)
    expect(run(['res', 'food', -9]).state.res.food).toBe(0)
    expect(run(['res', 'meds', 20]).state.res.meds).toBe(9)
    expect(run(['stat', 'hp', -2]).log).toEqual([{ kind: 'FX', text: 'stat hp -2 -> 3' }])
  })
  it('trust clamps to -100..100 and fear to 0..100', () => {
    expect(run(['trust', 'nora', 10]).state.npc['nora']?.trust).toBe(20)
    expect(run(['trust', 'nora', -500]).state.npc['nora']?.trust).toBe(-100)
    expect(run(['fear', 'brick', 5]).state.npc['brick']?.fear).toBe(10)
    expect(run(['fear', 'brick', -50]).state.npc['brick']?.fear).toBe(0)
  })
  it('trust / fear / kill on an unknown npc are ERROR logs that change nothing', () => {
    const s = makeState()
    for (const e of [['trust', 'ghost', 5], ['fear', 'ghost', 5], ['kill', 'ghost']] as Effect[]) {
      const r = apply(e, s, deeds)
      expect(r.state).toBe(s)
      expect(r.log[0]?.kind).toBe('ERROR')
    }
  })
})
describe('apply: flags, traits, party, kill', () => {
  it('set and clear flags', () => {
    const set = run(['set', 'route_church'])
    expect(set.state.flags).toEqual({ route_church: true })
    expect(apply(['clear', 'route_church'], set.state, deeds).state.flags).toEqual({})
  })
  it('trait +/- adds once and removes; a missing sign is an ERROR', () => {
    const t = run(['trait', '+Hardened'], { traits: ['Medic'] })
    expect(t.state.traits).toEqual(['Medic', 'Hardened'])
    expect(apply(['trait', '+Hardened'], t.state, deeds).state.traits).toEqual(['Medic', 'Hardened'])
    expect(apply(['trait', '-Medic'], t.state, deeds).state.traits).toEqual(['Hardened'])
    expect(run(['trait', 'Hardened']).log[0]?.kind).toBe('ERROR')
  })
  it('party +/- joins and leaves; unknown npc, full party and missing sign are ERRORs', () => {
    const joined = run(['party', '+nora'])
    expect(joined.state.party).toEqual(['nora'])
    expect(apply(['party', '+nora'], joined.state, deeds).state.party).toEqual(['nora'])
    expect(apply(['party', '-nora'], joined.state, deeds).state.party).toEqual([])
    expect(run(['party', '+ghost']).log[0]?.kind).toBe('ERROR')
    expect(run(['party', 'nora']).log[0]?.kind).toBe('ERROR')
    const full = run(['party', '+hart'], { party: ['nora', 'brick', 'juno'] })
    expect(PARTY_MAX).toBe(3)
    expect(full.state.party).toEqual(['nora', 'brick', 'juno'])
    expect(full.log[0]?.text).toMatch(/full/)
    expect(apply(['party', '+nora'], full.state, deeds).log[0]?.kind).toBe('FX')
  })
  it('kill marks the npc dead and removes them from the party', () => {
    const r = run(['kill', 'nora'], { party: ['nora', 'brick'] })
    expect(r.state.npc['nora']?.alive).toBe(false)
    expect(r.state.party).toEqual(['brick'])
  })
})
describe('apply: honor, secrets, echoes, time', () => {
  it('honor goes through the deed table', () => {
    expect(run(['honor', 'mercy', true]).state.honor).toBe(5)
    expect(run(['honor', 'mercy', false]).owed).toBe(2)
  })
  it('secret holds an id once; reveal releases it', () => {
    const held = run(['secret', 'bite'])
    expect(held.state.secrets).toEqual(['bite'])
    expect(held.log[0]?.kind).toBe('SECRET')
    expect(apply(['secret', 'bite'], held.state, deeds).state.secrets).toEqual(['bite'])
    expect(apply(['reveal', 'bite'], held.state, deeds).state.secrets).toEqual([])
  })
  it('echo schedules through echoes.ts', () => {
    expect(run(['echo', { scene: 'c4.father', after: 12 }]).state.echoes).toEqual([{ scene: 'c4.father', dueIn: 12 }])
  })
  it('time sets day and/or phase; day is clamped to 1..21', () => {
    expect(run(['time', { day: 3, phase: 'night' }]).state).toMatchObject({ day: 3, phase: 'night' })
    expect(run(['time', { phase: 'dusk' }], { day: 5 }).state).toMatchObject({ day: 5, phase: 'dusk' })
    expect(run(['time', { day: 40 }]).state.day).toBe(21)
  })
  it('time never runs backwards: an earlier day is an ERROR that changes nothing (M3 s6, D34); the same day and later are fine', () => {
    const s = makeState({ day: 5, phase: 'dusk' })
    const back = apply(['time', { day: 1, phase: 'dawn' }], s, deeds)
    expect(back.state).toBe(s)
    expect(back.log).toEqual([{ kind: 'ERROR', text: 'time day 1 is before day 5: time does not run backwards, effect ignored' }])
    expect(apply(['time', { day: 5, phase: 'night' }], s, deeds).state).toMatchObject({ day: 5, phase: 'night' })
    expect(apply(['time', { day: 6, phase: 'dawn' }], s, deeds).state).toMatchObject({ day: 6, phase: 'dawn' })
    expect(apply(['time', { day: 40 }], makeState({ day: 21 }), deeds).log[0]?.kind).toBe('FX') // a clamped 40 is day 21, not before it
  })
  it('time never runs back within a day either: an earlier phase on the same day is an ERROR that changes nothing (M3 s7, D35)', () => {
    const s = makeState({ day: 3, phase: 'night' })
    for (const spec of [{ phase: 'dawn' }, { day: 3, phase: 'dusk' }, { day: 3, phase: 'day' }] as const) {
      const back = apply(['time', spec], s, deeds)
      expect(back.state).toBe(s)
      expect(back.log).toEqual([{ kind: 'ERROR', text: `time ${spec.phase} is before night on day 3: time does not run backwards, effect ignored` }])
    }
    expect(apply(['time', { phase: 'night' }], s, deeds).log[0]?.kind).toBe('FX') // the same moment is fine
    expect(apply(['time', { day: 3 }], s, deeds).state).toMatchObject({ day: 3, phase: 'night' })
    expect(apply(['time', { day: 4, phase: 'dawn' }], s, deeds).state).toMatchObject({ day: 4, phase: 'dawn' }) // a later day may start at any phase
  })
  it('an unknown effect kind is an ERROR log', () => {
    expect(run(['bogus', 'x'] as unknown as Effect).log[0]?.kind).toBe('ERROR')
  })
})
describe('applyAll', () => {
  it('applies in order and concatenates the log; undefined is an empty list', () => {
    const r = applyAll([['set', 'a'], ['res', 'food', -1], ['stat', 'hp', -1]], makeState(), deeds)
    expect(r.state).toMatchObject({ flags: { a: true }, res: { food: 2 }, stats: { hp: 4 } })
    expect(r.log).toHaveLength(3)
    const s = makeState()
    expect(applyAll(undefined, s, deeds)).toEqual({ state: s, log: [] })
  })
  it('an unwitnessed deed followed by a secret stores the remainder under that secret', () => {
    const r = applyAll([['honor', 'mercy', false], ['secret', 'hart_wife']], makeState(), deeds)
    expect(r.state).toMatchObject({ honor: 3, secrets: ['hart_wife'], owed: { hart_wife: 2 } })
    const revealed = applyAll([['reveal', 'hart_wife']], r.state, deeds)
    expect(revealed.state).toMatchObject({ honor: 5, secrets: [], owed: {} })
  })
  it('a secret with no deed before it owes nothing', () => {
    expect(applyAll([['secret', 'bite']], makeState(), deeds).state.owed).toEqual({})
  })
  it('a remainder with no secret after it is forfeited and logged', () => {
    const r = applyAll([['secret', 'bite'], ['honor', 'mercy', false]], makeState(), deeds)
    expect(r.state.owed).toEqual({})
    expect(r.log.at(-1)?.text).toMatch(/forfeited/)
  })
  it('two unwitnessed deeds before one secret add their remainders', () => {
    const r = applyAll([['honor', 'mercy', false], ['honor', 'sacrifice', false], ['secret', 'x']], makeState(), deeds)
    expect(r.state.owed).toEqual({ x: 8 })
  })
})
