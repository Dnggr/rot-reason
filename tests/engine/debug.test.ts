// tests/engine/debug.test.ts — DEBUG_JUMP / DEBUG_SET / DEBUG_ROLL: they edit the run, log a DEBUG line, refuse bad input without throwing, and steer the next d6
import { describe, expect, it } from 'vitest'
import { resolveCheck } from '../../src/engine/checks'
import { rngForRoll } from '../../src/engine/debug'
import { reduce } from '../../src/engine/reducer'
import { gameStateSchema } from '../../src/engine/stateSchema'
import type { Action, DebugPatch, GameState, Scene } from '../../src/engine/types'
import { makeState } from './fixtures'
import { errors, pick, run, start } from './reducerHelpers'
import { line3, makeStory } from './storyFixture'
const story = makeStory([...line3, { id: 'c3.in', text: 'in', on: [['set', 'entered'], ['res', 'food', 1]], next: 'c3.out' } as Scene, { id: 'c3.out', text: 'out', end: 'plain' }])
const last = (s: GameState): string => s.log[s.log.length - 1]?.text ?? ''
const set = (s: GameState, patch: DebugPatch): GameState => reduce(s, { type: 'DEBUG_SET', patch }, story)
describe('DEBUG_JUMP', () => {
  it('enters the scene through the normal path: its `on` effects run, the chapter changes, resume is cleared', () => {
    const s = run(story, { type: 'DEBUG_JUMP', scene: 'c3.in' })
    expect([s.scene, s.chapter, s.resume]).toEqual(['c3.in', 'c3', null])
    expect(s.flags['entered']).toBe(true)
    expect(s.res.food).toBe(2) // 1 from the background + 1 from `on`
    expect(s.log.some((e) => e.kind === 'DEBUG' && e.text === 'jump c1.a -> c3.in')).toBe(true)
    expect(errors(s)).toEqual([])
    expect(gameStateSchema.safeParse(s).success).toBe(true)
  })
  it('stays in the chapter when the scene is in it, and can enter a system scene', () => {
    const same = run(story, { type: 'DEBUG_JUMP', scene: 'c1.b' })
    expect([same.scene, same.chapter]).toEqual(['c1.b', 'c1'])
    expect(run(story, { type: 'DEBUG_JUMP', scene: 'sys.missing' }).scene).toBe('sys.missing')
  })
  it('does not touch history, so play continues from the new scene', () => {
    const s = run(story, { type: 'DEBUG_JUMP', scene: 'c1.b' }, { type: 'CONTINUE' })
    expect(s.scene).toBe('c2.a')
    expect(s.history).toEqual(['c1.b:>'])
  })
  it('refuses an unknown scene: state unchanged, one DEBUG line, no throw', () => {
    const before = start(story)
    const s = reduce(before, { type: 'DEBUG_JUMP', scene: 'nope.nope' }, story)
    expect(s.scene).toBe(before.scene)
    expect(last(s)).toBe('refused jump: no scene nope.nope')
    expect(errors(s)).toEqual([])
  })
})
describe('DEBUG_SET', () => {
  it('sets a stat, a resource, honor and the day to an exact value, and clamps to the range', () => {
    const s0 = start(story)
    expect(set(s0, { kind: 'stat', key: 'reason', value: 12 }).stats.reason).toBe(12)
    expect(set(s0, { kind: 'stat', key: 'hp', value: 99 }).stats.hp).toBe(5)
    expect(set(s0, { kind: 'res', key: 'ammo', value: 4 }).res.ammo).toBe(4)
    expect(set(s0, { kind: 'res', key: 'ammo', value: -3 }).res.ammo).toBe(0)
    expect(set(s0, { kind: 'honor', value: -250 }).honor).toBe(-100)
    expect(set(s0, { kind: 'day', value: 7 }).day).toBe(7)
    expect(set(s0, { kind: 'day', value: 0 }).day).toBe(1)
  })
  it('rounds, never produces -0, and logs what it did', () => {
    const s = set(start(story), { kind: 'honor', value: -0.4 })
    expect(Object.is(s.honor, 0)).toBe(true)
    expect(last(set(start(story), { kind: 'stat', key: 'reason', value: 20.6 }))).toBe('stat reason = 21')
    expect(gameStateSchema.safeParse(s).success).toBe(true)
  })
  it('switches flags on and off, trims the name, refuses an empty one', () => {
    const on = set(start(story), { kind: 'flag', key: ' seen_it ', on: true })
    expect(on.flags['seen_it']).toBe(true)
    expect(last(on)).toBe('flag seen_it on')
    expect(set(on, { kind: 'flag', key: 'seen_it', on: false }).flags).toEqual({})
    const bad = set(start(story), { kind: 'flag', key: '  ', on: true })
    expect(bad.flags).toEqual({})
    expect(last(bad)).toBe('refused flag: empty name')
  })
  it('refuses NaN and Infinity instead of throwing into sys.error', () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const s = set(start(story), { kind: 'stat', key: 'hp', value })
      expect(s.scene).toBe('c1.a')
      expect(s.stats.hp).toBe(5)
      expect(last(s)).toContain('is not a number')
    }
  })
  it('rng reseeds the roll stream and leaves the start seed alone', () => {
    const s = set(start(story), { kind: 'rng', value: 42 })
    expect([s.rng, s.seed]).toEqual([42, 3])
  })
})
describe('DEBUG_ROLL', () => {
  it('rngForRoll finds a state whose next d6 is each face, and none for anything else', () => {
    for (const face of [1, 2, 3, 4, 5, 6]) {
      const rng = rngForRoll(7, face)
      expect(rng).toBeDefined()
      expect(resolveCheck('grit', 1, makeState({ rng: rng ?? 0 }), {}).roll).toBe(face)
    }
    expect(rngForRoll(7, 7)).toBeUndefined()
    expect(rngForRoll(7, 3, 0)).toBeUndefined()
  })
  it('steers the next check: roll 6 passes the dc 6 grit check, roll 1 fails it', () => {
    const pass = run(story, { type: 'DEBUG_ROLL', roll: 6 }, pick('b'))
    expect(pass.flags['won']).toBe(true)
    expect(pass.log.some((e) => e.text.includes('d6=6'))).toBe(true)
    const fail = run(story, { type: 'DEBUG_ROLL', roll: 1 }, pick('b'))
    expect(fail.stats.hp).toBe(4)
    expect(fail.log.some((e) => e.text.includes('d6=1'))).toBe(true)
  })
  it('refuses 0, 7, 2.5 and NaN without changing the rng', () => {
    const before = start(story)
    for (const roll of [0, 7, 2.5, Number.NaN]) {
      const s = reduce(before, { type: 'DEBUG_ROLL', roll }, story)
      expect(s.rng).toBe(before.rng)
      expect(last(s)).toContain('is not a d6 face')
    }
  })
})
describe('DEBUG_* are plain actions', () => {
  it('survive a JSON round trip', () => {
    const a: Action[] = [{ type: 'DEBUG_JUMP', scene: 'c1.b' }, { type: 'DEBUG_SET', patch: { kind: 'flag', key: 'x', on: true } }, { type: 'DEBUG_ROLL', roll: 4 }]
    expect(JSON.parse(JSON.stringify(a))).toEqual(a)
  })
})
