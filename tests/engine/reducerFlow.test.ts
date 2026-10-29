// tests/engine/reducerFlow.test.ts — reduce: echoes with $resume, death, fallback scenes, thrown errors, LOAD
import { describe, expect, it } from 'vitest'
import { reduce } from '../../src/engine/reducer'
import type { Scene, Story } from '../../src/engine/types'
import { errors, pick, run, start } from './reducerHelpers'
import { line3, makeStory } from './storyFixture'
describe('echoes and $resume', () => {
  const echo: Scene = { id: 'c3.echo', tags: ['echo'], text: 'echo', on: [['set', 'echoed']], next: '$resume' }
  const story = makeStory([
    { id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', fx: [['echo', { scene: 'c3.echo', after: 1 }]], to: 'c1.b' }] },
    { id: 'c1.b', text: 'y', next: 'c1.c' },
    { id: 'c1.c', text: 'z', next: 'c1.d' },
    { id: 'c1.d', text: 'end', end: 'plain' },
    echo,
  ])
  it('fires after N scenes, then $resume returns to the original target', () => {
    const a = run(story, pick('a'))
    expect(a.scene).toBe('c1.b') // after: 1 -> one scene plays first
    const b = reduce(a, { type: 'CONTINUE' }, story)
    expect(b.scene).toBe('c3.echo')
    expect(b.resume).toBe('c1.c')
    expect(b.chapter).toBe('c1') // an echo scene does not change the chapter
    expect(b.flags['echoed']).toBe(true)
    const c = reduce(b, { type: 'CONTINUE' }, story)
    expect([c.scene, c.resume]).toEqual(['c1.c', null])
    expect(c.history).toEqual(['c1.a:a', 'c1.b:>', 'c3.echo:>'])
  })
  it('an `at` echo fires when the chapter starts, before the chapter\'s first scene', () => {
    const at = makeStory([
      { id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', echo: { scene: 'c3.echo', at: 'c2' }, to: 'c1.b' }] },
      { id: 'c1.b', text: 'y', next: 'c2.a' }, { id: 'c2.a', text: 'z', next: 'c2.b' }, { id: 'c2.b', text: 'w', end: 'plain' }, echo,
    ])
    const s = run(at, pick('a'), { type: 'CONTINUE' })
    expect([s.scene, s.resume, s.chapter]).toEqual(['c3.echo', 'c2.a', 'c2'])
  })
  it('an echo fires even before an ending scene, but never before death', () => {
    const e = makeStory([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', fx: [['echo', { scene: 'c3.echo', after: 1 }]], to: 'c1.b' }] }, { id: 'c1.b', text: 'y', next: 'c1.c' }, { id: 'c1.c', text: 'z', end: 'plain' }, echo])
    const s = run(e, pick('a'), { type: 'CONTINUE' })
    expect([s.scene, s.resume]).toEqual(['c3.echo', 'c1.c'])
    const dying = makeStory([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', fx: [['echo', { scene: 'c3.echo', after: 1 }]], to: 'c1.b' }] }, { id: 'c1.b', text: 'y', on: [['stat', 'hp', -9]], next: 'c1.c' }, { id: 'c1.c', text: 'z', end: 'plain' }, echo])
    expect(run(dying, pick('a')).scene).toBe('sys.death')
  })
  it('$resume with nothing pending, and a stale resume, are logged', () => {
    const bad = makeStory([{ id: 'c1.a', text: 'x', next: '$resume' }])
    const s = run(bad, { type: 'CONTINUE' })
    expect(s.scene).toBe('sys.missing')
    expect(errors(s)[0]).toContain('nothing pending')
    const stale = makeStory([{ id: 'c1.a', text: 'x', next: 'c1.b' }, { id: 'c1.b', text: 'y', end: 'plain' }])
    expect(errors(reduce({ ...start(stale), resume: 'c1.zz' }, { type: 'CONTINUE' }, stale))[0]).toContain('stale resume')
  })
  it('an echo whose scene does not exist is dropped with an ERROR and the flow continues', () => {
    const gone = makeStory([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', fx: [['echo', { scene: 'c9.gone', after: 1 }]], to: 'c1.b' }] }, { id: 'c1.b', text: 'y', next: 'c1.c' }, { id: 'c1.c', text: 'z', next: 'c1.d' }, { id: 'c1.d', text: 'w', end: 'plain' }])
    const s = run(gone, pick('a'), { type: 'CONTINUE' })
    expect(s.scene).toBe('c1.c')
    expect(errors(s)[0]).toContain('c9.gone is missing')
  })
})
describe('death and fallbacks', () => {
  it('hp 0 after the choice sends the player to sys.death, even before an ending', () => {
    const story = makeStory([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', fx: [['stat', 'hp', -9]], to: 'c1.end' }] }, { id: 'c1.end', text: 'y', end: 'plain' }])
    const s = run(story, pick('a'))
    expect(s.scene).toBe('sys.death')
    expect(s.log.some((e) => e.text === 'hp is 0')).toBe(true)
  })
  it('hp 0 from a scene\'s on-effects also ends in sys.death', () => {
    const story = makeStory([{ id: 'c1.a', text: 'x', next: 'c1.b' }, { id: 'c1.b', text: 'y', on: [['stat', 'hp', -9]], next: 'c1.c' }, { id: 'c1.c', text: 'z', end: 'plain' }])
    expect(run(story, { type: 'CONTINUE' }).scene).toBe('sys.death')
  })
  it('a missing target goes to sys.missing with an ERROR log', () => {
    const story = makeStory([{ id: 'c1.a', text: 'x', next: 'c1.nowhere' }])
    const s = run(story, { type: 'CONTINUE' })
    expect(s.scene).toBe('sys.missing')
    expect(errors(s)[0]).toContain('missing scene c1.nowhere')
  })
  it('a thrown error (NaN reaches clamp) becomes sys.error plus an ERROR log', () => {
    const story = makeStory([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', fx: [['stat', 'hp', Number.NaN]], to: 'c1.b' }] }, { id: 'c1.b', text: 'y', end: 'plain' }])
    const s = run(story, pick('a'))
    expect(s.scene).toBe('sys.error')
    expect(errors(s)[0]).toContain('reducer threw on CHOOSE')
  })
  it('a story without sys.missing fails loudly into sys.error', () => {
    const story = makeStory([{ id: 'c1.a', text: 'x', next: 'c1.zz' }])
    const bare: Story = { ...story, scenes: { 'c1.a': story.scenes['c1.a'] as Scene, 'sys.error': story.scenes['sys.error'] as Scene } }
    expect(reduce(start(story), { type: 'CONTINUE' }, bare).scene).toBe('sys.error')
  })
  it('a non-Error throw is reported too', () => {
    const story = makeStory(line3, { deeds: new Proxy({}, { getOwnPropertyDescriptor() { throw 'boom' } }) })
    expect(errors(reduce(start(story), pick('a'), story))[0]).toContain('reducer threw on CHOOSE: boom')
  })
})
describe('LOAD', () => {
  const story = makeStory(line3)
  it('restores a valid snapshot', () => {
    const snap = run(story, pick('a'))
    const s = reduce(start(story), { type: 'LOAD', save: { v: 1, seed: 3, bg: 'dockworker', name: 'Ash', history: snap.history, snapshot: snap, checkpoint: null, savedAt: 0 } }, story)
    expect(s.scene).toBe('c1.b')
    expect(s.history).toEqual(['c1.a:a'])
  })
  it('keeps the current state and logs when the snapshot is invalid', () => {
    const cur = start(story)
    const s = reduce(cur, { type: 'LOAD', save: { v: 1, seed: 3, bg: 'dockworker', name: 'Ash', history: [], snapshot: { ...cur, scene: 'c9.gone' }, checkpoint: null, savedAt: 0 } }, story)
    expect(s.scene).toBe('c1.a')
    expect(errors(s)[0]).toContain('LOAD snapshot is not a valid state')
  })
})