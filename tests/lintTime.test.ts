// tests/lintTime.test.ts — M3 s5 review bug closed in D34: lint:story warns when a `time` day is earlier than a day a route has already reached
import { describe, expect, it } from 'vitest'
import { lintStory } from '../scripts/lintCore'
import type { Scene } from '../src/engine/types'
import { makeStory, sys } from './engine/storyFixture'
const { scenes: _scenes, ...tables } = makeStory([{ id: 'c1.a', text: 'x', end: 'plain' }])
const lint = (scenes: Scene[]) => lintStory({ ch: scenes }, sys, { ...tables, start: 'c1.a' }, {}).warnings.filter((w) => w.includes('time day'))
const honor = [['honor', 'mercy', true]] as const
describe('lintTime', () => {
  it('stays quiet when days only move forward, along a line, a choice and an echo', () => {
    expect(lint([{ id: 'c1.a', text: 'x', time: { day: 1, phase: 'day' }, choices: [{ id: 'a', text: 'x', fx: honor, to: 'c1.b' }, { id: 'b', text: 'y', to: 'c1.b' }] }, { id: 'c1.b', text: 'x', on: [['time', { day: 2 }]], next: 'c1.c' }, { id: 'c1.c', text: 'x', time: { day: 2, phase: 'night' }, end: 'plain' }])).toEqual([])
  })
  it('warns about a scene.time earlier than a day an earlier scene reached', () => {
    const w = lint([{ id: 'c1.a', text: 'x', time: { day: 5 }, next: 'c1.b' }, { id: 'c1.b', text: 'x', time: { day: 2 }, end: 'plain' }])
    expect(w).toEqual(['c1.b: time day 2 is before day 5, which a route has reached when the player leaves; the engine ignores it with an ERROR'])
  })
  it('warns about an effect earlier than the route so far, and about a second time effect in the same list', () => {
    expect(lint([{ id: 'c1.a', text: 'x', on: [['time', { day: 4 }]], next: 'c1.b' }, { id: 'c1.b', text: 'x', on: [['time', { day: 1 }]], end: 'plain' }])).toEqual(['c1.b on: time day 1 is before day 4, which a route has reached by here; the engine ignores it with an ERROR'])
    expect(lint([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', fx: [['time', { day: 3 }], ['time', { day: 2 }]], to: 'c1.b' }, { id: 'b', text: 'y', to: 'c1.b' }] }, { id: 'c1.b', text: 'x', end: 'plain' }])).toEqual(['c1.a:a: time day 2 is before day 3, which a route has reached by here; the engine ignores it with an ERROR'])
  })
  it('judges each way out on its own (a branch that never ran far is fine) and takes an echo scene at the least day it can come back on', () => {
    const lone: Scene[] = [{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', fx: [['time', { day: 9 }], ...honor], to: 'c1.z' }, { id: 'b', text: 'y', to: 'c1.b' }] }, { id: 'c1.b', text: 'x', time: { day: 2 }, end: 'plain' }, { id: 'c1.z', text: 'x', end: 'plain' }]
    expect(lint(lone)).toEqual([]) // only choice a reaches day 9, and a goes to c1.z; b arrives on day 1
    const echo: Scene = { id: 'c1.e', tags: ['echo'], text: 'x', time: { day: 1 }, next: '$resume' }
    const a: Scene = { id: 'c1.a', text: 'x', on: [['time', { day: 3 }], ['echo', { scene: 'c1.e', after: 1 }]], next: 'c1.b' }
    expect(lint([a, echo, { id: 'c1.b', text: 'x', end: 'plain' }])).toEqual(['c1.e: time day 1 is before day 3, which a route has reached when the player leaves; the engine ignores it with an ERROR'])
  })
})
