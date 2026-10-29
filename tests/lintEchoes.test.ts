// tests/lintEchoes.test.ts — M3 s8 review bugs closed in M3 s9: an echo scene must exit with $resume, an echo that can never fire is warned about
import { describe, expect, it } from 'vitest'
import { lintStory } from '../scripts/lintCore'
import type { Scene } from '../src/engine/types'
import { makeStory, sys } from './engine/storyFixture'
const { scenes: _scenes, ...tables } = makeStory([{ id: 'c1.a', text: 'x', end: 'plain' }])
const lint = (scenes: Scene[], start = 'c1.a') => lintStory({ ch: scenes }, sys, { ...tables, start }, {})
const echo: Scene = { id: 'c1.e', tags: ['echo'], text: 'x', next: '$resume' }
const chain = (n: number): Scene[] => Array.from({ length: n }, (_v, i) => ({ id: `c1.s${i}`, text: 'x', ...(i === n - 1 ? { end: 'plain' } : { next: `c1.s${i + 1}` }) }))
describe('lintGraph: an echo scene must exit with $resume', () => {
  const planter: Scene = { id: 'c1.a', text: 'x', on: [['echo', { scene: 'c1.e', after: 1 }]], next: 'c1.b' }
  const tail: Scene[] = [{ id: 'c1.b', text: 'x', next: 'c1.c' }, { id: 'c1.c', text: 'x', end: 'plain' }]
  it('errors on an echo scene with `end`; one with no exit at all is a schema error', () => {
    const msg = 'c1.e: an echo scene must exit with $resume'
    const { next: _n, ...bare } = echo
    const ends: Scene = { ...bare, end: 'plain' }
    expect(lint([planter, ...tail, ends]).errors.some((e) => e.startsWith(msg))).toBe(true)
    expect(lint([planter, ...tail, bare]).errors.some((e) => e.includes("needs exactly one of 'choices', 'next' or 'end'"))).toBe(true) // no exit at all was already a schema error: the bug was the `end` case
  })
  it('is quiet for an echo scene that resumes, also through a choice', () => {
    expect(lint([planter, ...tail, echo]).errors).toEqual([])
    const choice: Scene = { id: 'c1.e', tags: ['echo'], text: 'x', choices: [{ id: 'a', text: 'Go on.', to: '$resume' }] }
    expect(lint([planter, ...tail, choice]).errors).toEqual([])
  })
})
describe('lintEchoes: an echo that can never fire', () => {
  const never = (scenes: Scene[]) => lint(scenes).warnings.filter((w) => w.includes('can never fire'))
  it('warns when `after` is longer than the longest route (a choice echo and an `on` echo alike)', () => {
    const on: Scene = { id: 'c1.s0', text: 'x', on: [['echo', { scene: 'c1.e', after: 400 }]], next: 'c1.s1' }
    const w = never([on, ...chain(3).slice(1), echo])
    expect(w).toHaveLength(1)
    expect(w[0]).toContain('c1.s0 on: echo c1.e after 400 can never fire')
    const choice: Scene = { id: 'c1.s0', text: 'x', choices: [{ id: 'a', text: 'Go.', echo: { scene: 'c1.e', after: 5 }, to: 'c1.s1' }] }
    expect(never([choice, ...chain(3).slice(1), echo])).toHaveLength(1)
  })
  it('is quiet when the route is long enough, and when a loop lets the player go on', () => {
    const fits: Scene = { id: 'c1.s0', text: 'x', on: [['echo', { scene: 'c1.e', after: 1 }]], next: 'c1.s1' } // needs 2 transitions: s0 > s1 > s2
    expect(never([fits, ...chain(3).slice(1), echo])).toEqual([])
    expect(never([{ ...fits, on: [['echo', { scene: 'c1.e', after: 2 }]] }, ...chain(3).slice(1), echo])).toHaveLength(1) // needs 3, the route has 2
    const loop: Scene[] = [{ id: 'c1.s0', text: 'x', on: [['echo', { scene: 'c1.e', after: 50 }]], choices: [{ id: 'a', text: 'Again.', to: 'c1.s0' }, { id: 'b', text: 'Stop.', to: 'c1.z' }] }, { id: 'c1.z', text: 'x', end: 'plain' }, echo]
    expect(never(loop)).toEqual([])
  })
  it('does not judge an echo planted by an echo scene (it resumes into a route the graph cannot see)', () => {
    const planter: Scene = { id: 'c1.a', text: 'x', on: [['echo', { scene: 'c1.e', after: 1 }]], next: 'c1.z' }
    const chained: Scene = { ...echo, on: [['echo', { scene: 'c1.f', after: 3 }]] }
    const second: Scene = { ...echo, id: 'c1.f' }
    expect(never([planter, { id: 'c1.z', text: 'x', next: 'c1.y' }, { id: 'c1.y', text: 'x', end: 'plain' }, chained, second])).toEqual([])
  })
  it('warns when no route reaches the `at` chapter, quiet when one does', () => {
    const at = (chapter: string): Scene[] => [{ id: 'c1.a', text: 'x', on: [['echo', { scene: 'c1.e', at: chapter }]], next: 'c1.z' }, { id: 'c1.z', text: 'x', next: 'c2.a' }, { id: 'c2.a', text: 'x', end: 'plain' }, { id: 'c3.a', text: 'x', end: 'plain' }, echo]
    expect(lint(at('c2')).warnings.filter((w) => w.includes('no route from'))).toEqual([])
    const miss = lint(at('c3')).warnings.filter((w) => w.includes('no route from'))
    expect(miss).toHaveLength(1)
    expect(miss[0]).toContain("echo c1.e is due 'at' c3, but no route from c1.a reaches a scene of c3")
  })
})
