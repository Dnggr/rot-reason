// tests/engine/honor.test.ts — tiers, witness halving, diminishing returns, scene cap, clamp, secret surfacing
import { describe, expect, it } from 'vitest'
import { applyDeed, capScene, SCENE_CAP, surface, tierOf } from '../../src/engine/honor'
import { DEEDS } from '../../src/story/honor'
import { deeds, makeState } from './fixtures'
describe('tierOf', () => {
  it('maps every boundary in HONOR.md §2', () => {
    const at = [-100, -61, -60, -21, -20, 0, 20, 21, 60, 61, 100].map(tierOf)
    expect(at).toEqual(['T1', 'T1', 'T2', 'T2', 'T3', 'T3', 'T3', 'T4', 'T4', 'T5', 'T5'])
  })
})
describe('applyDeed', () => {
  it('a witnessed deed applies the full delta and logs it', () => {
    const r = applyDeed(makeState({ honor: 7 }), 'mercy', true, 1, deeds)
    expect(r.state.honor).toBe(12)
    expect(r.log).toEqual([{ kind: 'HONOR', text: '+5 mercy witnessed -> 12' }])
    expect(r.owed).toBeUndefined()
  })
  it('an unwitnessed deed applies half now and owes the rest', () => {
    const r = applyDeed(makeState(), 'mercy', false, 1, deeds)
    expect(r.state.honor).toBe(3)
    expect(r.owed).toBe(2)
    expect(r.log[0]?.text).toBe('+3 mercy unseen -> 3')
  })
  it('half-and-remainder always add up to the full delta, for negative deeds too', () => {
    for (const tag of Object.keys(DEEDS)) {
      const r = applyDeed(makeState(), tag, false, 1, DEEDS)
      expect(r.state.honor + (r.owed ?? 0)).toBe(DEEDS[tag])
    }
  })
  it('the same tag repeated in a chapter gives 100%, 50%, then 25%', () => {
    let s = makeState()
    const gains: number[] = []
    for (let i = 0; i < 4; i++) {
      const r = applyDeed(s, 'sacrifice', true, 1, deeds)
      gains.push(r.state.honor - s.honor)
      s = r.state
    }
    expect(gains).toEqual([12, 6, 3, 3])
    expect(s.deedCount['sacrifice']).toBe(4)
  })
  it('scale x2 and x0.5 are the only multipliers', () => {
    expect(applyDeed(makeState(), 'mercy', true, 2, deeds).state.honor).toBe(10)
    expect(applyDeed(makeState(), 'mercy', true, 0.5, deeds).state.honor).toBe(3)
  })
  it('clamps to -100..+100', () => {
    expect(applyDeed(makeState({ honor: 98 }), 'sacrifice', true, 1, deeds).state.honor).toBe(100)
    expect(applyDeed(makeState({ honor: -95 }), 'murder', true, 1, deeds).state.honor).toBe(-100)
  })
  it('an unknown tag is an ERROR log and changes nothing', () => {
    const s = makeState()
    const r = applyDeed(s, 'toString', true, 1, deeds)
    expect(r.state).toBe(s)
    expect(r.log[0]).toEqual({ kind: 'ERROR', text: 'unknown deed tag toString' })
  })
  it('does not mutate its input', () => {
    const s = makeState()
    applyDeed(s, 'mercy', false, 1, deeds)
    expect(s.honor).toBe(0)
    expect(s.deedCount).toEqual({})
  })
})
describe('capScene', () => {
  it('limits the net change in one scene to ±25 in both directions', () => {
    expect(capScene(0, makeState({ honor: 40 })).state.honor).toBe(SCENE_CAP)
    expect(capScene(0, makeState({ honor: -40 })).state.honor).toBe(-SCENE_CAP)
    expect(capScene(10, makeState({ honor: 36 })).log[0]?.text).toBe('scene cap ±25 -> 35')
  })
  it('leaves a change inside the cap alone', () => {
    const s = makeState({ honor: 20 })
    const r = capScene(0, s)
    expect(r.state).toBe(s)
    expect(r.log).toEqual([])
  })
})
describe('surface', () => {
  const held = makeState({ honor: 3, secrets: ['hart_wife', 'bite'], owed: { hart_wife: 2 } })
  it('releases the secret and applies the honor it owed', () => {
    const r = surface(held, 'hart_wife')
    expect(r.state.secrets).toEqual(['bite'])
    expect(r.state.honor).toBe(5)
    expect(r.state.owed).toEqual({})
    expect(r.log.map((l) => l.text)).toEqual(['reveal hart_wife', '+2 hart_wife surfaced -> 5'])
  })
  it('a secret that owes nothing only logs the reveal', () => {
    const r = surface(held, 'bite')
    expect(r.state.honor).toBe(3)
    expect(r.state.owed).toEqual({ hart_wife: 2 })
    expect(r.log).toHaveLength(1)
  })
  it('owed honor from a negative deed lowers honor, clamped at -100', () => {
    const s = makeState({ honor: -99, secrets: ['x'], owed: { x: -10 } })
    expect(surface(s, 'x').state.honor).toBe(-100)
  })
  it('revealing a secret that is not held is an ERROR and changes nothing', () => {
    const r = surface(held, 'nope')
    expect(r.state).toBe(held)
    expect(r.log[0]?.kind).toBe('ERROR')
  })
})
