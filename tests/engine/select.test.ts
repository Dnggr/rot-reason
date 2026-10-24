// tests/engine/select.test.ts — currentView: beats, glitch, choice states, lock condition, odds, endings, missing scene; hudOf; checkOdds; resolveEnding
import { describe, expect, it } from 'vitest'
import { checkOdds } from '../../src/engine/checks'
import { endingIds, resolveEnding } from '../../src/engine/endings'
import { currentView, hudOf } from '../../src/engine/select'
import type { Scene } from '../../src/engine/types'
import { makeState } from './fixtures'
import { makeStory } from './storyFixture'
const scene: Scene = {
  id: 'c1.a', who: ['nora'], place: 'church_nave', mood: 'dread', glitch: 'the walls breathe',
  text: ['plain line', { if: ['flag', 'seen'], text: 'seen line' }, { if: ['trust', 'nora', '>=', 50], text: 'close line' }],
  choices: [
    { id: 'a', text: 'Open.', tone: 'brave', to: 'c1.a' },
    { id: 'b', text: 'Secret.', if: ['flag', 'seen'], to: 'c1.a' },
    { id: 'c', text: 'Locked.', lock: ['honor', '>=', 10], to: 'c1.a' },
    { id: 'd', text: 'Pay.', cost: { ammo: 3 }, check: { attr: 'grit', dc: 5, pass: { to: 'c1.a' }, fail: { to: 'c1.a' } } },
  ],
}
const story = makeStory([scene])
describe('currentView', () => {
  it('resolves beats by condition and copies the scene fields', () => {
    const v = currentView(makeState({ scene: 'c1.a', flags: { seen: true } }), story)
    expect(v).toMatchObject({ kind: 'choices', scene: 'c1.a', who: ['nora'], place: 'church_nave', mood: 'dread', ending: undefined })
    expect(v.lines).toEqual(['plain line', 'seen line'])
    expect(currentView(makeState({ scene: 'c1.a' }), story).lines).toEqual(['plain line'])
  })
  it('gives each line with its speaker (`say`), keeps the conditions, and `lines` is the same text', () => {
    const talk: Scene = { id: 'c1.t', next: 'c1.a', text: ['narration', { say: 'nora', text: '"Hi."' }, { if: ['flag', 'seen'], say: 'nora', text: '"Seen."' }, { if: ['flag', 'seen'], text: 'seen line' }] }
    const st = makeStory([talk])
    const v = currentView(makeState({ scene: 'c1.t', flags: { seen: true } }), st)
    expect(v.beats).toEqual([{ text: 'narration', say: undefined }, { text: '"Hi."', say: 'nora' }, { text: '"Seen."', say: 'nora' }, { text: 'seen line', say: undefined }])
    expect(v.lines).toEqual(v.beats.map((b) => b.text))
    expect(currentView(makeState({ scene: 'c1.t' }), st).beats.map((b) => b.text)).toEqual(['narration', '"Hi."'])
  })
  it('low reason shows the glitch text instead', () => {
    expect(currentView(makeState({ scene: 'c1.a', stats: { hp: 5, reason: 29, rot: 0 } }), story).lines).toEqual(['the walls breathe'])
    expect(currentView(makeState({ scene: 'c1.a', stats: { hp: 5, reason: 30, rot: 0 } }), story).lines).toHaveLength(1)
  })
  it('hides `if` choices, disables locked and unaffordable ones with the reason, adds odds for checks', () => {
    const v = currentView(makeState({ scene: 'c1.a' }), story)
    expect(v.choices.map((c) => [c.id, c.enabled, c.why])).toEqual([['a', true, undefined], ['c', false, 'lock'], ['d', false, 'cost']])
    expect(v.choices[0]).toMatchObject({ tone: 'brave', odds: undefined, cost: undefined })
    expect(v.choices[2]).toMatchObject({ cost: { ammo: 3 }, odds: 'likely' })
    expect(currentView(makeState({ scene: 'c1.a', flags: { seen: true } }), story).choices.map((c) => c.id)).toEqual(['a', 'b', 'c', 'd'])
  })
  it('next, end (fixed and auto) and unknown scenes', () => {
    const s = makeStory([{ id: 'c1.n', text: 'n', next: 'c1.e' }, { id: 'c1.e', text: 'e', end: 'auto' }, { id: 'c1.f', text: 'f', end: 'death' }])
    expect(currentView(makeState({ scene: 'c1.n' }), s).kind).toBe('next')
    expect(currentView(makeState({ scene: 'c1.e', honor: 9 }), s)).toMatchObject({ kind: 'end', ending: 'good' })
    expect(currentView(makeState({ scene: 'c1.e', honor: 0 }), s).ending).toBe('plain')
    expect(currentView(makeState({ scene: 'c1.f' }), s).ending).toBe('death')
    const missing = currentView(makeState({ scene: 'c9.zz' }), s)
    expect(missing).toMatchObject({ kind: 'error', scene: 'c9.zz', lines: [], choices: [] })
    const bare = makeStory([{ id: 'c1.x', text: 'x' } as Scene])
    expect(currentView(makeState({ scene: 'c1.x' }), bare).kind).toBe('error')
  })
})
describe('checkOdds', () => {
  const s = makeState({ attr: { grit: 2, wits: 3, heart: 1 }, traits: ['Bruiser'] })
  const table = { Bruiser: { grit: 2 } }
  it('maps the d6 win chance to risky / even / likely', () => {
    expect(checkOdds('wits', 10, s, table)).toBe('risky') // needs 7: never
    expect(checkOdds('wits', 8, s, table)).toBe('risky') // needs 5: 2 of 6
    expect(checkOdds('wits', 7, s, table)).toBe('even') // needs 4: 3 of 6
    expect(checkOdds('wits', 6, s, table)).toBe('likely') // needs 3: 4 of 6
    expect(checkOdds('wits', 1, s, table)).toBe('likely') // always
  })
  it('counts trait bonuses', () => {
    expect(checkOdds('grit', 8, s, table)).toBe('even') // 2 + 2 bonus: needs 4
    expect(checkOdds('grit', 8, s, {})).toBe('risky') // without the bonus: needs 6
  })
})
describe('resolveEnding', () => {
  const rules = [{ id: 'one', if: ['flag', 'x'] as const }, { id: 'two', if: ['honor', '>=', 5] as const }, { id: 'last' }]
  it('first match wins, a rule without a condition always matches', () => {
    expect(resolveEnding(makeState({ flags: { x: true }, honor: 9 }), rules)).toBe('one')
    expect(resolveEnding(makeState({ honor: 9 }), rules)).toBe('two')
    expect(resolveEnding(makeState(), rules)).toBe('last')
  })
  it('falls back to sys_error when nothing matches', () => {
    expect(resolveEnding(makeState(), [{ id: 'one', if: ['flag', 'x'] }])).toBe('sys_error')
  })
  it('lists the ids a scene may name', () => {
    expect(endingIds(rules)).toEqual(['auto', 'death', 'sys_error', 'one', 'two', 'last'])
  })
})
describe('lock condition and hudOf (M2 s1)', () => {
  it('a locked choice carries its lock condition; open, broke and hidden ones do not', () => {
    const v = currentView(makeState({ scene: 'c1.a' }), story)
    expect(v.choices.map((c) => c.lock)).toEqual([undefined, ['honor', '>=', 10], undefined])
  })
  it('hudOf copies the vitals and derives the tier', () => {
    const s = makeState({ name: 'Ash', day: 4, phase: 'dusk', honor: 24, stats: { hp: 3, reason: 55, rot: 2 }, res: { food: 1, ammo: 0, meds: 2 } })
    expect(hudOf(s)).toEqual({ name: 'Ash', day: 4, phase: 'dusk', stats: { hp: 3, reason: 55, rot: 2 }, res: { food: 1, ammo: 0, meds: 2 }, honor: 24, tier: 'T4' })
    expect(hudOf(makeState({ honor: -80 })).tier).toBe('T1')
    expect(hudOf(s).stats).not.toBe(s.stats) // a copy, so the UI cannot mutate state
  })
})
