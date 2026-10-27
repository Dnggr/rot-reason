// tests/engine/closeout.test.ts — M3 s3 (D31): the bugs flagged in the M3 s2 review, each with the case that found it: refused join, the dead stay put, the scene cap in the deed list, the met list
import { describe, expect, it } from 'vitest'
import { trimDeeds } from '../../src/engine/deeds'
import { apply, applyAll } from '../../src/engine/effects'
import { changeChapter, enter } from '../../src/engine/flow'
import { journalOf } from '../../src/engine/journal'
import { meet, metIn } from '../../src/engine/met'
import { NO_SOCIAL, shift, wouldLeave } from '../../src/engine/relations'
import { reduce } from '../../src/engine/reducer'
import type { DeedRecord, Effect, GameState, Scene } from '../../src/engine/types'
import { deeds, makeState, social } from './fixtures'
import { makeStory } from './storyFixture'
import { pick, run } from './reducerHelpers'
const npcs = (over: Record<string, { alive: boolean; trust: number; fear: number }>): GameState['npc'] => ({ ...makeState().npc, ...over })
const texts = (r: { log: { text: string }[] }): string[] => r.log.map((l) => l.text)
describe('a companion who would walk out at once cannot be recruited (was: silent join and leave)', () => {
  it('trust at or under the leave line with fear under the hold line: ERROR, nothing changes', () => {
    const r = applyAll([['trust', 'nora', -45], ['party', '+nora']], makeState(), deeds, social)
    expect(r.state.party).toEqual([])
    expect(r.log.find((l) => l.kind === 'ERROR')?.text).toMatch(/party \+nora: nora would walk out at once \(trust -35, fear 0/)
    expect(texts(r).some((t) => t.includes('walked out'))).toBe(false) // no join and leave pair in the log any more
  })
  it('the line is exact: -30 is refused, -29 is let in, and fear 60+ holds a distrustful companion', () => {
    const at = (trust: number, fear: number): GameState => makeState({ npc: npcs({ nora: { alive: true, trust, fear } }) })
    expect(apply(['party', '+nora'], at(-30, 59), deeds, social).state.party).toEqual([])
    expect(apply(['party', '+nora'], at(-29, 0), deeds, social).state.party).toEqual(['nora'])
    expect(apply(['party', '+nora'], at(-80, 60), deeds, social).state.party).toEqual(['nora'])
    expect(wouldLeave({ alive: true, trust: -30, fear: 59 }, social)).toBe(true)
    expect(wouldLeave({ alive: true, trust: -30, fear: 60 }, social)).toBe(false)
  })
  it('without a table nobody is refused, and someone already in the party is not refused again', () => {
    const low = makeState({ npc: npcs({ nora: { alive: true, trust: -90, fear: 0 } }) })
    expect(apply(['party', '+nora'], low, deeds, NO_SOCIAL).state.party).toEqual(['nora'])
    const r = apply(['party', '+nora'], { ...low, party: ['nora'] }, deeds, social)
    expect(r.log[0]?.kind).toBe('FX')
    expect(r.state.party).toEqual(['nora'])
  })
  it('joining first and then losing their trust in the same list still ends with the walk-out (a story choice, logged)', () => {
    const r = applyAll([['party', '+nora'], ['trust', 'nora', -45]], makeState(), deeds, social)
    expect(r.state.party).toEqual([])
    expect(texts(r).some((t) => t.startsWith('party -nora: walked out'))).toBe(true)
  })
})
describe('the dead do not change (was: a dead npc keeps changing)', () => {
  const dead = (): GameState => makeState({ npc: npcs({ nora: { alive: false, trust: 10, fear: 40 } }) })
  it('trust and fear effects on a dead npc are logged and ignored, not an ERROR', () => {
    const a = apply(['trust', 'nora', 20], dead(), deeds, social)
    const b = apply(['fear', 'nora', 10], dead(), deeds, social)
    expect(a.state.npc['nora']).toEqual({ alive: false, trust: 10, fear: 40 })
    expect(b.state.npc['nora']).toEqual({ alive: false, trust: 10, fear: 40 })
    expect(a.log).toEqual([{ kind: 'FX', text: 'trust nora +20: nora is dead, no change' }])
    expect(shift(dead(), 'ghost', 'trust', 1, [-100, 100]).log[0]?.kind).toBe('ERROR') // an unknown npc is still an error
  })
  it('a kill followed by a trust effect in one list leaves the numbers where they were', () => {
    const r = applyAll([['kill', 'nora'], ['trust', 'nora', 20], ['fear', 'nora', 10]], makeState(), deeds, social)
    expect(r.state.npc['nora']).toEqual({ alive: false, trust: 10, fear: 0 })
  })
  it('the fear fade at a chapter change skips the dead and still fades the living', () => {
    const s = changeChapter(makeState({ npc: npcs({ nora: { alive: false, trust: 10, fear: 40 }, brick: { alive: true, trust: 0, fear: 40 } }) }), 'c2', social).state
    expect(s.npc['nora']?.fear).toBe(40)
    expect(s.npc['brick']?.fear).toBe(35)
  })
})
const rec = (delta: number, over: Partial<DeedRecord> = {}): DeedRecord => ({ tag: 'x', witnessed: true, surfaced: false, day: 1, delta, who: {}, ...over })
describe('the scene cap is taken back off the deed list (was: Journal honor before the cap)', () => {
  const big = { murder: -20, hero: 20, mercy: 5 }
  const scene = (fx: Effect[]): Scene[] => [{ id: 'c1.a', text: 'a', choices: [{ id: 'a', text: 'Go.', fx, to: 'c1.b' }] }, { id: 'c1.b', text: 'b', end: 'plain' }]
  const sum = (s: GameState): number => s.deeds.reduce((n, d) => n + d.delta, 0)
  it('three murders (-20, -10, -5) hit the cap of -25: the newest deeds give back 10 and the list adds up to the meter', () => {
    const story = makeStory(scene([['honor', 'murder', true], ['honor', 'murder', true], ['honor', 'murder', true]]), { deeds: big })
    const s = run(story, pick('a'))
    expect(s.honor).toBe(-25)
    expect(s.deeds.map((d) => d.delta)).toEqual([-20, -5, 0])
    expect(sum(s)).toBe(s.honor)
  })
  it('the same for a rise, and a deed of the other sign is never touched or flipped', () => {
    const story = makeStory(scene([['honor', 'hero', true], ['honor', 'hero', true], ['honor', 'hero', true], ['honor', 'murder', true]]), { deeds: big })
    const s = run(story, pick('a')) // +20 +10 +5 -20 = +15: under the cap, nothing to give back
    expect(s.deeds.map((d) => d.delta)).toEqual([20, 10, 5, -20])
    const capped = makeStory(scene([['honor', 'hero', true], ['honor', 'hero', true], ['honor', 'hero', true], ['honor', 'hero', true], ['honor', 'mercy', true]]), { deeds: big })
    const c = run(capped, pick('a')) // +20 +10 +5 +5 (4th hero, 25% of 20) +5 = 45, cap 25
    expect(c.honor).toBe(25)
    expect(sum(c)).toBe(25)
    expect(c.deeds.every((d) => d.delta >= 0)).toBe(true)
  })
  it('a deed from an earlier scene keeps its number; only this scene\'s deeds are trimmed', () => {
    const early = makeState({ deeds: [rec(5, { tag: 'mercy' })] })
    const list = early.deeds
    const out = applyAll([['honor', 'murder', true], ['honor', 'murder', true], ['honor', 'murder', true]], early, big, social)
    expect(out.state.deeds[0]).toBe(list[0]) // same record, untouched
    const story = makeStory([{ id: 'c1.a', text: 'a', next: 'c1.b' }, { id: 'c1.b', text: 'b', on: [['honor', 'murder', true], ['honor', 'murder', true], ['honor', 'murder', true]], end: 'plain' }], { deeds: big })
    const s = enter({ ...early, scene: 'c1.a' }, 'c1.b', story).state // the scene's own `on` effects are capped the same way
    expect(s.deeds.map((d) => d.delta)).toEqual([5, -20, -5, 0])
    expect(s.honor).toBe(-25 + early.honor)
  })
  it('trimDeeds: stops at the old list, never flips a sign, and does nothing when the cap took nothing', () => {
    const old = [rec(-9)]
    const list = [...old, rec(-4), rec(-3)]
    expect(trimDeeds(list, 5, old).map((d) => d.delta)).toEqual([-9, -2, 0]) // the newest absorbs first (-3 -> 0), then the one before (-4 -> -2)
    expect(trimDeeds(list, 99, old).map((d) => d.delta)).toEqual([-9, 0, 0]) // the old -9 stays whatever is left over
    expect(trimDeeds(list, 0, old)).toEqual(list)
    expect(trimDeeds(list, 5, list).map((d) => d.delta)).toEqual([-9, -4, -3]) // nothing is new
  })
})
describe('the met list (was: People hides someone you met whose numbers never moved)', () => {
  const story = makeStory([
    { id: 'c1.a', text: [{ say: 'nora', text: 'Hi.' }, { if: ['flag', 'late'], say: 'brick', text: 'Late.' }], who: ['ghost'], next: 'c1.b' },
    { id: 'c1.b', text: 'b', who: ['brick'], end: 'plain' },
  ])
  it('meet adds registered npcs once, in order, and returns the same state when nobody is new', () => {
    const s = makeState()
    expect(meet(s, ['brick', 'ghost', 'nora', 'brick']).met).toEqual(['brick', 'nora'])
    const again = meet(s, ['nora'])
    expect(meet(again, ['nora'])).toBe(again)
  })
  it('metIn lists a scene\'s who and the speakers of the beats that show', () => {
    expect(metIn(story.scenes['c1.a'] as Scene, makeState())).toEqual(['ghost', 'nora'])
    expect(metIn(story.scenes['c1.a'] as Scene, makeState({ flags: { late: true } }))).toEqual(['ghost', 'nora', 'brick'])
    expect(metIn({ id: 'c1.z', text: 'plain', end: 'plain' }, makeState())).toEqual([])
  })
  it('entering a scene marks who it shows as met (an unknown id is ignored), and START does too', () => {
    const s = reduce(makeState(), { type: 'START', bg: 'dockworker', name: 'Ash', seed: 3 }, story)
    expect(s.met).toEqual(['nora'])
    expect(reduce(s, { type: 'CONTINUE' }, story).met).toEqual(['nora', 'brick'])
  })
  it('a trust or fear effect and a join mark the npc as met; the party is always met', () => {
    expect(apply(['trust', 'juno', 5], makeState(), deeds, social).state.met).toEqual(['juno'])
    expect(apply(['fear', 'hart', 5], makeState(), deeds, social).state.met).toEqual(['hart'])
    expect(apply(['party', '+nora'], makeState(), deeds, social).state.met).toEqual(['nora'])
    expect(apply(['trust', 'ghost', 5], makeState(), deeds, social).state.met).toEqual([])
  })
  it('the Journal lists someone met whose numbers never moved, in their own place after the party', () => {
    const s = makeState({ met: ['brick'], party: ['nora'] })
    expect(journalOf(s, story).people.map((p) => p.id)).toEqual(['nora', 'brick'])
    expect(journalOf(makeState({ party: [] }), story).people).toEqual([])
  })
})
