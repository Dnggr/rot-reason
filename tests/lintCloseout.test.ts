// tests/lintCloseout.test.ts — M3 s7 review bugs closed in D36: no plain exit into an echo scene, no soft-lock by cost, no empty page from all-conditional beats
import { describe, expect, it } from 'vitest'
import { lintStory } from '../scripts/lintCore'
import type { Scene } from '../src/engine/types'
import { makeStory, sys } from './engine/storyFixture'
const { scenes: _scenes, ...tables } = makeStory([{ id: 'c1.a', text: 'x', end: 'plain' }])
const lint = (scenes: Scene[], start = 'c1.a') => lintStory({ ch: scenes }, sys, { ...tables, start }, {})
const end: Scene = { id: 'c1.z', text: 'x', end: 'plain' }
const echo: Scene = { id: 'c1.e', tags: ['echo'], text: 'x', next: '$resume' }
const planter: Scene = { id: 'c1.p', text: 'x', on: [['echo', { scene: 'c1.e', after: 1 }]], next: 'c1.z' }
describe('lintGraph: an echo scene is reached by an echo effect only', () => {
  const msg = (from: string) => `${from}: exit to c1.e is an echo scene; an echo scene is reached by an 'echo' effect only (a plain exit leaves $resume with nothing pending and lands on sys.missing)`
  it('errors on `next`, a choice target and a check branch target', () => {
    expect(lint([{ id: 'c1.a', text: 'x', next: 'c1.e' }, planter, echo, end]).errors).toContain(msg('c1.a'))
    expect(lint([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', to: 'c1.e' }, { id: 'b', text: 'y', to: 'c1.z' }] }, planter, echo, end]).errors).toContain(msg('c1.a'))
    const check: Scene = { id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', check: { attr: 'grit', dc: 5, pass: { to: 'c1.z' }, fail: { to: 'c1.e' } } }] }
    expect(lint([check, planter, echo, end]).errors).toContain(msg('c1.a'))
  })
  it('is quiet when only an echo effect reaches it, and for the echo scene own $resume', () => {
    expect(lint([{ ...planter, id: 'c1.a' }, echo, end]).errors).toEqual([])
  })
  it('errors on an echo scene as the start scene', () => {
    expect(lint([echo, planter, end], 'c1.e').errors.some((e) => e.includes('start scene c1.e is an echo scene'))).toBe(true)
  })
})
describe('lintStyle: nothing always open', () => {
  const only = (c: NonNullable<Scene['choices']>): Scene[] => [{ id: 'c1.a', text: 'x', choices: c }, end]
  const soft = (scenes: Scene[]) => lint(scenes).warnings.filter((w) => w.includes('soft-lock'))
  it('warns when every choice has an if, a lock or a cost', () => {
    expect(soft(only([{ id: 'a', text: 'x', cost: { ammo: 1 }, to: 'c1.z' }]))).toEqual(['c1.a: every choice has if/lock/cost (possible soft-lock: nothing is always open)'])
    expect(soft(only([{ id: 'a', text: 'x', lock: ['flag', 'k'], to: 'c1.z' }, { id: 'b', text: 'y', cost: { food: 1 }, to: 'c1.z' }]))).toHaveLength(1)
  })
  it('is quiet with one plain choice', () => {
    expect(soft(only([{ id: 'a', text: 'x', cost: { ammo: 1 }, to: 'c1.z' }, { id: 'b', text: 'y', to: 'c1.z' }]))).toEqual([])
  })
})
describe('lintStyle: an empty page', () => {
  const beats = (text: Scene['text']): Scene[] => [{ id: 'c1.a', text, next: 'c1.z' }, end]
  const empty = (scenes: Scene[]) => lint(scenes).warnings.filter((w) => w.includes('can be empty'))
  it('warns when every beat has an if, quiet with one plain beat or a plain string', () => {
    expect(empty(beats([{ if: ['flag', 'k'], text: 'only with k' }]))).toEqual(['c1.a: every beat of the text has an `if` (the page can be empty)'])
    expect(empty(beats(['plain', { if: ['flag', 'k'], text: 'k' }]))).toEqual([])
    expect(empty(beats('plain'))).toEqual([])
  })
  it('is quiet when the beats name every background, warns when one is left out', () => {
    expect(empty(beats([{ if: ['bg', 'dockworker'], text: 'a' }]))).toEqual([]) // the fixture has one background
    expect(lintStory({ ch: beats([{ if: ['bg', 'dockworker'], text: 'a' }]) }, sys, { ...tables, start: 'c1.a', backgrounds: { ...tables.backgrounds, mechanic: { ...tables.backgrounds['dockworker']!, name: 'Mechanic' } } }, {}).warnings.filter((w) => w.includes('can be empty'))).toHaveLength(1)
  })
})
