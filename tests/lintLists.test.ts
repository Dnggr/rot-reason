// tests/lintLists.test.ts — M3 s6 review bugs closed in D35: lint:story catches an untagged echo target, a forfeited unwitnessed deed, a secret condition nobody holds, an echo `at` its own chapter and a doubled echo
import { describe, expect, it } from 'vitest'
import { lintStory } from '../scripts/lintCore'
import type { Effect, Scene } from '../src/engine/types'
import { makeStory, sys } from './engine/storyFixture'
const { scenes: _scenes, ...tables } = makeStory([{ id: 'c1.a', text: 'x', end: 'plain' }])
const lint = (scenes: Scene[]) => lintStory({ ch: scenes }, sys, { ...tables, start: 'c1.a' }, {})
// the tiny stories here skip the style rules (an honor tag, no fake choices), so each test reads only the warnings it is about
const warns = (scenes: Scene[], part: string): string[] => lint(scenes).warnings.filter((w) => w.includes(part))
const end: Scene = { id: 'c1.z', text: 'x', end: 'plain' }
const echo: Scene = { id: 'c1.e', tags: ['echo'], text: 'x', next: '$resume' }
const withFx = (fx: Effect[], more: Scene[] = []): Scene[] => [{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', fx, to: 'c1.z' }, { id: 'b', text: 'y', to: 'c1.z' }] }, end, ...more]
describe('lintGraph: an echo target must be tagged echo', () => {
  const a: Scene = { id: 'c1.a', text: 'x', on: [['echo', { scene: 'c1.e', after: 1 }]], next: 'c1.z' }
  it('errors on an untagged target and says which scene schedules it', () => {
    const r = lint([a, { id: 'c1.e', text: 'x', next: 'c1.z' }, end])
    expect(r.errors).toEqual(["c1.a: echo target c1.e must be tagged 'echo' (an untagged echo scene drops the player's destination, STORY_FORMAT §5)"])
  })
  it('also checks the echo of a choice, and stays quiet for a tagged target', () => {
    const viaChoice: Scene = { id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', echo: { scene: 'c1.e', after: 1 }, to: 'c1.z' }] }
    expect(lint([viaChoice, { id: 'c1.e', text: 'x', next: 'c1.z' }, end]).errors).toHaveLength(1)
    expect(lint([a, echo, end]).errors).toEqual([])
  })
})
describe('lintLists: an unwitnessed deed needs a secret after it', () => {
  it('warns when the list ends with the deed held by nothing, once per way out', () => {
    expect(warns(withFx([['honor', 'mercy', false]]), 'unwitnessed')).toEqual(["c1.a:a: unwitnessed deed mercy has no `secret` after it in the list: the engine forfeits it (nothing is owed, nobody ever reacts); put `['secret', id]` after the deed or make it witnessed"])
  })
  it('is quiet with a secret after the deed, a witnessed deed, and a secret before the deed (which does not hold it)', () => {
    expect(lint(withFx([['honor', 'mercy', false], ['secret', 'bite']])).warnings.filter((w) => w.includes('unwitnessed'))).toEqual([])
    expect(lint(withFx([['honor', 'mercy', true]])).warnings.filter((w) => w.includes('unwitnessed'))).toEqual([])
    expect(lint(withFx([['secret', 'bite'], ['honor', 'mercy', false]])).warnings.filter((w) => w.includes('unwitnessed'))).toHaveLength(1)
  })
  it('names every deed the secret did not catch, and looks at `on` lists and check branches', () => {
    const w = warns(withFx([['honor', 'mercy', false], ['secret', 'bite'], ['honor', 'mercy', false]]), 'unwitnessed')
    expect(w).toHaveLength(1)
    expect(w[0]).toContain('unwitnessed deed mercy')
    const onList: Scene[] = [{ id: 'c1.a', text: 'x', on: [['honor', 'mercy', false]], next: 'c1.z' }, end]
    expect(warns(onList, 'unwitnessed')[0]).toContain('c1.a on: unwitnessed deed mercy')
    const branch: Scene[] = [{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', check: { attr: 'grit', dc: 5, pass: { fx: [['honor', 'mercy', false]], to: 'c1.z' }, fail: { to: 'c1.z' } } }] }, end]
    expect(warns(branch, 'unwitnessed')).toHaveLength(1)
    expect(warns(branch, 'unwitnessed')[0]).toContain('c1.a:a pass:')
  })
})
describe('lintRefs: a secret condition nobody holds', () => {
  const read: Scene = { id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', if: ['secret', 'nobody'], to: 'c1.z' }, { id: 'b', text: 'y', to: 'c1.z' }] }
  it('warns for a choice condition, and for a beat condition', () => {
    expect(warns([read, end], 'secret condition')).toEqual(['c1.a: secret condition nobody is read but no scene holds that secret (it can never be true)'])
    const beat: Scene = { id: 'c1.a', text: ['x', { if: ['secret', 'nobody'], text: 'y' }], next: 'c1.z' }
    expect(warns([beat, end], 'secret condition')).toHaveLength(1)
  })
  it('is quiet once a scene holds the secret', () => {
    const holder: Scene = { id: 'c1.a', text: 'x', on: [['secret', 'nobody']], choices: read.choices ?? [] }
    expect(warns([holder, end], 'secret condition')).toEqual([])
  })
  it('checks an ending rule too', () => {
    const r = lintStory({ ch: [{ id: 'c1.a', text: 'x', end: 'plain' }] }, sys, { ...tables, start: 'c1.a', endings: [{ id: 'good', if: ['secret', 'nobody'] }, { id: 'plain' }] }, {})
    expect(r.warnings.filter((w) => w.includes('secret condition'))).toEqual(['ending good: secret condition nobody is read but no scene holds that secret (it can never be true)'])
  })
})
describe('lintLists: echoes', () => {
  it("warns when an echo is due `at` the chapter its scene is in, and not for a later chapter", () => {
    const own = warns(withFx([['echo', { scene: 'c1.e', at: 'c1' }]], [echo]), 'echo')
    expect(own).toHaveLength(1)
    expect(own[0]).toContain("c1.a:a: echo c1.e is due 'at' c1, the chapter this scene is in")
    const later = lint([{ id: 'c1.a', text: 'x', on: [['echo', { scene: 'c2.e', at: 'c2' }]], next: 'c2.z' }, { id: 'c2.z', text: 'x', end: 'plain' }, { id: 'c2.e', tags: ['echo'], text: 'x', next: '$resume' }])
    expect(later.warnings.filter((w) => w.includes('echo'))).toEqual([])
  })
  it('warns when one list schedules the same echo twice (the engine keeps one), also through a choice `echo`', () => {
    const twice = warns(withFx([['echo', { scene: 'c1.e', after: 1 }], ['echo', { scene: 'c1.e', after: 1 }]], [echo]), 'scheduled twice')
    expect(twice).toEqual(['c1.a:a: echo c1.e is scheduled twice in one list; the engine keeps one (an identical pending echo is skipped)'])
    const viaChoice: Scene = { id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', fx: [['echo', { scene: 'c1.e', after: 1 }]], echo: { scene: 'c1.e', after: 1 }, to: 'c1.z' }] }
    expect(warns([viaChoice, end, echo], 'scheduled twice')).toHaveLength(1)
    expect(warns(withFx([['echo', { scene: 'c1.e', after: 1 }], ['echo', { scene: 'c1.e', after: 2 }]], [echo]), 'scheduled twice')).toEqual([])
  })
})
