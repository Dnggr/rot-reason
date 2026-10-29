// tests/engine/social.test.ts — M3 s1 (D29): companion approval, the trust hit when a secret surfaces, party rules, the walk-out rule; golden path for an unwitnessed deed that surfaces later
import { describe, expect, it } from 'vitest'
import { apply, applyAll } from '../../src/engine/effects'
import { changeChapter } from '../../src/engine/flow'
import { NO_SOCIAL, party, react, walkouts } from '../../src/engine/relations'
import { reduce } from '../../src/engine/reducer'
import { currentView } from '../../src/engine/select'
import type { Action, Effect, Scene } from '../../src/engine/types'
import { deeds, makeState, social } from './fixtures'
import { makeStory } from './storyFixture'
import { errors, pick, run, start } from './reducerHelpers'
const withNora = (over = {}) => makeState({ party: ['nora', 'brick'], ...over })
const trust = (s: { npc: Record<string, { trust: number } | undefined> }, id: string): number | undefined => s.npc[id]?.trust
describe('approval: a witnessed deed moves the companions who are with you', () => {
  it('only party members react, by the table, and the log says why', () => {
    const r = apply(['honor', 'mercy', true], withNora(), deeds, social)
    expect(trust(r.state, 'nora')).toBe(20) // 10 + 10
    expect(trust(r.state, 'brick')).toBe(0) // Brick has no mercy entry
    expect(trust(r.state, 'juno')).toBe(0) // not in the party
    expect(r.log.map((l) => l.text)).toContain('nora reacts to mercy: trust +10 -> 20')
    expect(trust(apply(['honor', 'mercy', true], makeState(), deeds, social).state, 'nora')).toBe(10) // nobody with you
  })
  it('a dislike lowers trust, and repeating a deed in one chapter is scaled like honor (100%, 50%, 25%)', () => {
    const s = withNora()
    const lie1 = apply(['honor', 'lie', true], s, deeds, social)
    expect(trust(lie1.state, 'nora')).toBe(5) // 10 - 5
    const lie2 = apply(['honor', 'lie', true], lie1.state, deeds, social)
    expect(trust(lie2.state, 'nora')).toBe(2) // 5 - round(2.5) = 5 - 3 (halves round away from zero)
    const lie3 = apply(['honor', 'lie', true], lie2.state, deeds, social)
    expect(trust(lie3.state, 'nora')).toBe(1) // 2 - round(1.25) = 2 - 1
  })
  it('trust is clamped, a dead companion never reacts, and tags not in the table move nobody', () => {
    expect(trust(apply(['honor', 'mercy', true], withNora({ npc: { ...makeState().npc, nora: { alive: true, trust: 95, fear: 0 } } }), deeds, social).state, 'nora')).toBe(100)
    const dead = withNora({ npc: { ...makeState().npc, nora: { alive: false, trust: 10, fear: 0 } } })
    expect(trust(react(dead, 'mercy', 1, social).state, 'nora')).toBe(10)
    expect(react(withNora(), 'honest', 1, social).log).toEqual([])
  })
  it('without a table nothing happens (NO_SOCIAL), and unwitnessed deeds do not move anyone yet', () => {
    expect(trust(apply(['honor', 'mercy', true], withNora(), deeds).state, 'nora')).toBe(10)
    expect(NO_SOCIAL.approval).toEqual({})
    expect(trust(apply(['honor', 'mercy', false], withNora(), deeds, social).state, 'nora')).toBe(10)
  })
})
describe('secrets: the party reacts when what was hidden comes out', () => {
  const hide: Effect[] = [['honor', 'murder', false], ['secret', 'bite']]
  it('an unwitnessed deed followed by a secret stores its tag next to the honor it owes', () => {
    const r = applyAll(hide, withNora(), deeds, social)
    expect(r.state).toMatchObject({ honor: -10, secrets: ['bite'], owed: { bite: -10 }, owedTags: { bite: ['murder'] } })
    expect(trust(r.state, 'nora')).toBe(10) // nobody saw it
    expect(r.log.map((l) => l.text)).toContain('bite hides murder and owes -10 honor on reveal')
  })
  it('reveal pays the honor and the companions with you react in full, then the tag is forgotten', () => {
    const held = applyAll(hide, withNora(), deeds, social).state
    const r = apply(['reveal', 'bite'], held, deeds, social)
    expect(r.state).toMatchObject({ honor: -20, secrets: [], owed: {}, owedTags: {} })
    expect(trust(r.state, 'nora')).toBe(0) // 10 - 10
  })
  it('only who is in the party at the reveal reacts (a companion who joined later hears of it too, one who left does not)', () => {
    const held = applyAll(hide, makeState(), deeds, social).state
    const joined = apply(['party', '+nora'], held, deeds, social).state
    expect(trust(apply(['reveal', 'bite'], joined, deeds, social).state, 'nora')).toBe(0)
    expect(trust(apply(['reveal', 'bite'], held, deeds, social).state, 'nora')).toBe(10)
  })
  it('a zero remainder still hides the deed, two deeds share one secret, a deed with no secret is forfeited and logged', () => {
    const tiny = applyAll([['honor', 'honest', false], ['honor', 'lie', false], ['secret', 'x']], makeState(), deeds, social)
    expect(tiny.state.owedTags).toEqual({ x: ['honest', 'lie'] })
    const lost = applyAll([['secret', 'x'], ['honor', 'lie', false]], makeState(), deeds, social)
    expect(lost.state.owedTags).toEqual({})
    expect(lost.log.at(-1)?.text).toMatch(/forfeited/)
  })
  it('revealing a secret that is not held is an ERROR and reacts to nothing', () => {
    const r = apply(['reveal', 'ghost'], withNora({ owedTags: { ghost: ['murder'] } }), deeds, social)
    expect(r.log[0]?.kind).toBe('ERROR')
    expect(trust(r.state, 'nora')).toBe(10)
  })
})
describe('party rules', () => {
  it('a dead companion cannot join the party (ERROR, nothing changes)', () => {
    const s = makeState({ npc: { ...makeState().npc, nora: { alive: false, trust: 10, fear: 0 } } })
    const r = apply(['party', '+nora'], s, deeds, social)
    expect(r.state).toBe(s)
    expect(r.log[0]).toEqual({ kind: 'ERROR', text: 'party +nora: nora is dead' })
  })
})
describe('walk-out: trust at the line and no fear to hold them', () => {
  const low = (trustV: number, fear: number) => withNora({ npc: { ...makeState().npc, nora: { alive: true, trust: trustV, fear }, brick: { alive: true, trust: 50, fear: 0 } } })
  it('leaves at trust -30 or lower with fear under 60, and the others stay', () => {
    const r = walkouts(low(-30, 0), social)
    expect(r.state.party).toEqual(['brick'])
    expect(r.log[0]?.text).toBe('party -nora: walked out (trust -30, fear 0)')
    expect(walkouts(low(-29, 0), social).state.party).toEqual(['nora', 'brick'])
  })
  it('fear of 60 or more keeps them, and the fade at a chapter change lets them go', () => {
    const feared = low(-50, 62)
    expect(walkouts(feared, social).state.party).toEqual(['nora', 'brick'])
    expect(changeChapter(feared, 'c2', social).state.party).toEqual(['brick']) // fear 62 fades to 57, under 60: nothing holds her
    expect(changeChapter(low(-50, 70), 'c2', social).state.party).toEqual(['nora', 'brick']) // 65 still holds
  })
  it('an effect list that drops trust under the line ends with the companion gone', () => {
    const r = applyAll([['trust', 'nora', -45]], withNora(), deeds, social)
    expect(r.state.party).toEqual(['brick'])
    expect(r.state.npc['nora']?.alive).toBe(true) // gone, not dead
  })
  it('does nothing without a table', () => {
    expect(walkouts(low(-100, 0), NO_SOCIAL).state.party).toEqual(['nora', 'brick'])
  })
})
// ---- golden path (M3 definition of done): an unwitnessed deed surfaces later and applies the remainder, with the party present ----
const chain: Scene[] = [
  { id: 'c1.a', text: 'The pantry.', choices: [{ id: 'a', text: 'Take it and say nothing.', fx: [['honor', 'murder', false], ['secret', 'pantry'], ['party', '+nora']], to: 'c1.b' }] },
  { id: 'c1.b', text: 'Walking.', next: 'c1.c' },
  { id: 'c1.c', text: 'More walking.', next: 'c2.a' },
  { id: 'c2.a', text: 'Someone talks.', choices: [
    { id: 'a', text: 'Confess.', fx: [['reveal', 'pantry']], to: 'c2.end' },
    { id: 'b', text: 'Say nothing.', to: 'c2.end' },
  ] },
  { id: 'c2.end', text: 'The end.', end: 'auto' },
]
describe('golden: an unwitnessed deed surfaces later and applies the remainder', () => {
  const story = makeStory(chain)
  const go: Action = { type: 'CONTINUE' }
  it('half the honor at once, nobody reacts, the rest and the trust hit when it surfaces', () => {
    const s = run(story, pick('a'), go, go)
    expect(s).toMatchObject({ scene: 'c2.a', honor: -10, secrets: ['pantry'], owed: { pantry: -10 }, owedTags: { pantry: ['murder'] }, party: ['nora'] })
    expect(trust(s, 'nora')).toBe(10) // she did not see it
    const out = reduce(s, pick('a'), story)
    expect(out).toMatchObject({ scene: 'c2.end', honor: -20, secrets: [], owed: {}, owedTags: {} })
    expect(trust(out, 'nora')).toBe(0) // the murder table entry, in full
    expect(errors(out)).toEqual([])
    expect(currentView(out, story).ending).toBe('plain')
  })
  it('kept quiet, the secret stays held and the honor stays half paid', () => {
    const s = reduce(run(story, pick('a'), go, go), pick('b'), story)
    expect(s).toMatchObject({ honor: -10, secrets: ['pantry'], owed: { pantry: -10 } })
    expect(trust(s, 'nora')).toBe(10)
  })
  it('the run replays: the same history gives the same state, trust included', () => {
    const live = run(story, pick('a'), go, go, pick('a'))
    expect(live.history).toEqual(['c1.a:a', 'c1.b:>', 'c1.c:>', 'c2.a:a'])
    expect(start(story).history).toEqual([])
  })
})
describe('party -id of an unknown npc (was: a silent success, M3 s4 bug, D33)', () => {
  it('is an ERROR like +id, and changes nothing', () => {
    for (const spec of ['-ghost', '+ghost']) {
      const r = party(makeState({ party: ['nora'] }), spec, social)
      expect(r.log.map((l) => l.kind)).toEqual(['ERROR'])
      expect(r.log[0]?.text).toBe(`party ${spec}: unknown npc`)
      expect(r.state.party).toEqual(['nora'])
    }
  })
  it('-id of a known npc that is not in the party is still a quiet no-op, and of one in the party still leaves', () => {
    expect(party(makeState(), '-nora', social).log.map((l) => l.kind)).toEqual(['FX'])
    expect(party(makeState({ party: ['nora'] }), '-nora', social).state.party).toEqual([])
  })
})