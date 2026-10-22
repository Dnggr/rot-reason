// tests/engine/reducer.test.ts — reduce: START, CHOOSE order and validation, CONTINUE, time, chapter changes
import { describe, expect, it } from 'vitest'
import { reduce } from '../../src/engine/reducer'
import type { Scene } from '../../src/engine/types'
import { makeState } from './fixtures'
import { errors, pick, run, start } from './reducerHelpers'
import { line3, makeStory } from './storyFixture'
describe('START', () => {
  const story = makeStory(line3)
  it('builds the state from the background, the npc table and the seed', () => {
    const s = start(story)
    expect(s).toMatchObject({ scene: 'c1.a', chapter: 'c1', bg: 'dockworker', name: 'Ash', seed: 3, traits: ['Hauler'], honor: 0, resume: null })
    expect(s.attr).toEqual({ grit: 4, wits: 2, heart: 3 })
    expect(s.res.food).toBe(1)
    expect(s.npc['nora']).toEqual({ alive: true, trust: 10, fear: 20 })
    expect(s.log.map((e) => e.kind)).toEqual(['FX', 'SCENE'])
  })
  it('runs the first scene\'s on-effects', () => {
    const s = start(makeStory([{ id: 'c1.a', text: 'x', on: [['set', 'seen'], ['res', 'meds', 2]], end: 'plain' }]))
    expect(s.flags).toEqual({ seen: true })
    expect(s.res.meds).toBe(2)
  })
  it('a start scene that does not exist falls back to sys.missing', () => {
    const s = start(makeStory(line3, { start: 'c9.nowhere' }))
    expect(s.scene).toBe('sys.missing')
    expect(errors(s)[0]).toContain('missing scene c9.nowhere')
  })
  it('an unknown background ends on sys.error with an ERROR log, not a throw', () => {
    const s = reduce(makeState(), { type: 'START', bg: 'ghost', name: 'Ash', seed: 1 }, story)
    expect(s.scene).toBe('sys.error')
    expect(errors(s)[0]).toContain('unknown background ghost')
  })
})
describe('CHOOSE', () => {
  const story = makeStory(line3)
  it('applies fx, records history, moves on', () => {
    const s = run(story, pick('a'))
    expect(s.scene).toBe('c1.b')
    expect(s.honor).toBe(5)
    expect(s.history).toEqual(['c1.a:a'])
    expect(s.log.map((e) => e.kind)).toContain('CHOICE')
  })
  it('a check rolls the seeded d6, applies its branch and is replayable', () => {
    const s = run(story, pick('b'))
    expect(s.scene).toBe('c1.b')
    expect(s.log.some((e) => e.text.startsWith('check grit dc 6'))).toBe(true)
    expect(s.flags['won'] === true || s.stats.hp === 4).toBe(true)
    expect(run(story, pick('b'))).toEqual(s)
  })
  it('ignores a locked or unaffordable choice and logs it', () => {
    const locked = run(story, pick('c'))
    expect(locked.scene).toBe('c1.a')
    expect(locked.history).toEqual([])
    expect(errors(locked)[0]).toContain('is locked')
    const broke = reduce({ ...start(story), honor: 9, res: { food: 0, ammo: 0, meds: 0 } }, pick('c'), story)
    expect(errors(broke)[0]).toContain('is broke')
  })
  it('charges the cost once the choice is open', () => {
    const s = reduce({ ...start(story), honor: 9 }, pick('c'), story)
    expect(s.res.food).toBe(0)
    expect(s.scene).toBe('c1.b')
  })
  it('ignores a stale click: unknown choice, hidden choice, scene without choices', () => {
    expect(errors(run(story, pick('d')))[0]).toContain('no choice d')
    const hidden = makeStory([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', if: ['flag', 'nope'], to: 'c1.a' }, { id: 'b', text: 'y', to: 'c1.a' }] }])
    expect(errors(run(hidden, pick('a')))[0]).toContain('is hidden')
    expect(errors(run(story, pick('a'), pick('a')))[0]).toContain('no choice a in c1.b')
  })
  it('a choice without a target goes to sys.missing with an ERROR', () => {
    const broken = { id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x' }] } as Scene
    const s = run(makeStory([broken]), pick('a'))
    expect(s.scene).toBe('sys.missing')
    expect(errors(s).join('|')).toContain('has no target')
  })
  it('applies fx before the choice echo, then the scene cap (net honor +-25 per scene)', () => {
    const big = makeStory([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', fx: [['honor', 'sacrifice', true], ['honor', 'sacrifice', true], ['honor', 'sacrifice', true]], to: 'c1.b' }] }, { id: 'c1.b', text: 'y', end: 'plain' }])
    expect(run(big, pick('a')).honor).toBe(12 + 6 + 3)
    const huge = makeStory([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', fx: [['honor', 'murder', true], ['honor', 'murder', true]], to: 'c1.b' }] }, { id: 'c1.b', text: 'y', end: 'plain' }], { deeds: { murder: -30 } })
    expect(run(huge, pick('a')).honor).toBe(-25) // -30 and -15 would be -45: the scene cap holds it at -25
  })
})
describe('CONTINUE and time', () => {
  it('moves along next, records "scene:>" and applies the departing scene\'s time', () => {
    const story = makeStory([{ id: 'c1.a', text: 'x', time: { day: 3, phase: 'night' }, next: 'c1.b' }, { id: 'c1.b', text: 'y', end: 'plain' }])
    const s = run(story, { type: 'CONTINUE' })
    expect(s.scene).toBe('c1.b')
    expect(s.history).toEqual(['c1.a:>'])
    expect([s.day, s.phase]).toEqual([3, 'night'])
  })
  it('CONTINUE on a scene without next, or CHOOSE on an end scene, is ignored', () => {
    const story = makeStory(line3)
    expect(errors(run(story, { type: 'CONTINUE' }))[0]).toContain('has no next')
    const end = makeStory([{ id: 'c1.a', text: 'x', end: 'plain' }])
    expect(errors(run(end, pick('a')))[0]).toContain('no choice a')
  })
  it('CAMP is a stub that logs and changes nothing', () => {
    const story = makeStory(line3)
    const s = run(story, { type: 'CAMP', action: 'rest' })
    expect(s.scene).toBe('c1.a')
    expect(errors(s)[0]).toContain('CAMP rest is not implemented')
  })
})
describe('chapters', () => {
  it('a chapter change resets deed counts and fades fear by 5 (never below 0)', () => {
    const story = makeStory(line3)
    const s = run(story, pick('a'), { type: 'CONTINUE' })
    expect(s.chapter).toBe('c2')
    expect(s.deedCount).toEqual({})
    expect(s.npc['nora']?.fear).toBe(15)
    expect(s.npc['brick']?.fear).toBe(0)
  })
  it('deed counts persist inside a chapter (diminishing returns)', () => {
    const loop = makeStory([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', fx: [['honor', 'mercy', true]], to: 'c1.a' }] }])
    expect(run(loop, pick('a'), pick('a'), pick('a')).honor).toBe(5 + 3 + 1) // 5, 50% of 5 -> 3 (away from zero), 25% -> 1
  })
})
