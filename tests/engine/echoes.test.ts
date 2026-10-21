// tests/engine/echoes.test.ts — schedule / tick / due / take: after-N-scenes, at-chapter, order, bad specs
import { describe, expect, it } from 'vitest'
import { due, schedule, take, tick } from '../../src/engine/echoes'
import { makeState } from './fixtures'
describe('schedule', () => {
  it('after: N stores a countdown; at: stores the chapter', () => {
    const a = schedule(makeState(), { scene: 'c4.hart_knows', after: 14 })
    expect(a.state.echoes).toEqual([{ scene: 'c4.hart_knows', dueIn: 14 }])
    expect(a.log).toEqual([{ kind: 'ECHO', text: 'c4.hart_knows in 14' }])
    const b = schedule(a.state, { scene: 'c4.father', at: 'c4' })
    expect(b.state.echoes[1]).toEqual({ scene: 'c4.father', atChapter: 'c4' })
    expect(b.log[0]?.text).toBe('c4.father at c4')
  })
  it('both or neither of after / at is an ERROR and schedules nothing', () => {
    const s = makeState()
    for (const spec of [{ scene: 'x', after: 1, at: 'c1' }, { scene: 'x' }]) {
      const r = schedule(s, spec)
      expect(r.state).toBe(s)
      expect(r.log[0]?.kind).toBe('ERROR')
    }
  })
})
describe('tick / due / take', () => {
  it('after: 2 fires on the second transition after it was scheduled, not before', () => {
    let s = schedule(makeState(), { scene: 'echo', after: 2 }).state
    s = tick(s)
    expect(due(s)).toBeUndefined()
    s = tick(s)
    expect(due(s)?.scene).toBe('echo')
  })
  it('tick floors at 0, leaves chapter echoes alone and returns the same state when nothing counts', () => {
    const s = makeState({ echoes: [{ scene: 'a', dueIn: 0 }, { scene: 'b', atChapter: 'c9' }] })
    expect(tick(s)).toBe(s)
    expect(tick(makeState())).toEqual(makeState())
  })
  it('a chapter echo is due only while that chapter is current', () => {
    const s = schedule(makeState({ chapter: 'c1' }), { scene: 'later', at: 'c4' }).state
    expect(due(s)).toBeUndefined()
    expect(due({ ...s, chapter: 'c4' })?.scene).toBe('later')
  })
  it('take removes the first due echo in insertion order and logs it', () => {
    const s = makeState({ echoes: [{ scene: 'wait', dueIn: 3 }, { scene: 'one', dueIn: 0 }, { scene: 'two', dueIn: 0 }] })
    const t1 = take(s)
    expect(t1.scene).toBe('one')
    expect(t1.state.echoes.map((e) => e.scene)).toEqual(['wait', 'two'])
    expect(t1.log).toEqual([{ kind: 'ECHO', text: 'fire one' }])
    expect(take(t1.state).scene).toBe('two')
  })
  it('take with nothing due returns the same state and no log', () => {
    const s = makeState({ echoes: [{ scene: 'wait', dueIn: 3 }] })
    expect(take(s)).toEqual({ state: s, scene: undefined, log: [] })
  })
})
