// tests/engine/save.test.ts — makeSave checkpoints, migrate, validState, replay, loadSave fallbacks, storage, and replay determinism
import { describe, expect, it } from 'vitest'
import { SAVE_VERSION } from '../../src/engine/init'
import { reduce } from '../../src/engine/reducer'
import { loadSave, makeSave, migrate, MIGRATIONS, readSave, replay, SAVE_KEY, writeSave, type KeyValueStore } from '../../src/engine/save'
import { gameStateSchema, validState } from '../../src/engine/stateSchema'
import type { Action, GameState, Scene } from '../../src/engine/types'
import { makeState } from './fixtures'
import { line3, makeStory } from './storyFixture'
const gated: Scene[] = line3.map((s) => (s.id === 'c1.b' ? { ...s, tags: ['gate'] } : s))
const story = makeStory(gated)
const begin = (): GameState => reduce(makeState(), { type: 'START', bg: 'dockworker', name: 'Ash', seed: 3 }, story)
const play = (...actions: Action[]): GameState => actions.reduce((s, a) => reduce(s, a, story), begin())
const a: Action = { type: 'CHOOSE', choice: 'a' }
const cont: Action = { type: 'CONTINUE' }
const stored = (): Record<string, unknown> => JSON.parse(JSON.stringify(makeSave(play(a, cont), null, story, 1234)))
describe('state schema', () => {
  it('accepts a real state and survives a JSON round trip', () => {
    const s = play(a)
    expect(gameStateSchema.safeParse(JSON.parse(JSON.stringify(s))).success).toBe(true)
  })
  it('rejects out-of-range values, unknown keys, unknown scenes and the error scene', () => {
    const s = play(a)
    expect(validState({ ...s, honor: 500 }, story)).toBeUndefined()
    expect(validState({ ...s, extra: 1 }, story)).toBeUndefined()
    expect(validState({ ...s, scene: 'c9.zz' }, story)).toBeUndefined()
    expect(validState({ ...s, scene: 'sys.error' }, story)).toBeUndefined()
    expect(validState({ ...s, flags: { x: false } }, story)).toBeUndefined()
    expect(validState('nope', story)).toBeUndefined()
    expect(validState(s, story)).toEqual(s)
  })
})
describe('makeSave', () => {
  it('moves the checkpoint when the player stands on a gate scene, keeps it otherwise', () => {
    const before = play()
    expect(makeSave(before, null, story, 5).checkpoint).toBeNull()
    const atGate = play(a)
    const gate = makeSave(atGate, null, story, 5)
    expect(gate.checkpoint).toEqual(atGate)
    expect(makeSave(play(a, cont), gate.checkpoint, story, 6).checkpoint).toEqual(atGate)
    expect(gate).toMatchObject({ v: SAVE_VERSION, seed: 3, bg: 'dockworker', name: 'Ash', history: ['c1.a:a'], savedAt: 5 })
  })
})
describe('migrate v1 -> v4 (owedTags D29, deeds D30, met D31)', () => {
  const v1State = (): Record<string, unknown> => {
    const { owedTags: _dropped, deeds: _deeds, met: _met, ...rest } = play(a, cont)
    return { ...rest, v: 1, secrets: ['x'], owed: { x: -3 } }
  }
  const v1Save = (): Record<string, unknown> => ({ v: 1, seed: 3, bg: 'dockworker', name: 'Ash', history: ['c1.a:a', 'c1.b:>'], snapshot: v1State(), checkpoint: v1State(), savedAt: 5 })
  it('adds an empty owedTags, deeds and met to the snapshot and the checkpoint and stamps both versions', () => {
    const m = migrate(v1Save())
    expect(m['v']).toBe(4)
    expect(m['snapshot']).toMatchObject({ v: 4, owedTags: {}, deeds: [], met: [], secrets: ['x'], owed: { x: -3 } })
    expect(m['checkpoint']).toMatchObject({ v: 4, owedTags: {}, deeds: [], met: [] })
  })
  it('keeps a missing checkpoint missing, and a v1 save loads through loadSave as a valid state', () => {
    expect(migrate({ ...v1Save(), checkpoint: null })['checkpoint']).toBeNull()
    const r = loadSave(v1Save(), story)
    expect(r.ok && r.via).toBe('snapshot')
  })
})
describe('migrate v2 -> v4 (deeds D30, met D31)', () => {
  const v2State = (): Record<string, unknown> => {
    const { deeds: _dropped, met: _met, ...rest } = play(a, cont)
    return { ...rest, v: 2, honor: 5 }
  }
  const v2Save = (): Record<string, unknown> => ({ v: 2, seed: 3, bg: 'dockworker', name: 'Ash', history: ['c1.a:a', 'c1.b:>'], snapshot: v2State(), checkpoint: v2State(), savedAt: 5 })
  it('gives the snapshot and the checkpoint an empty deed list and keeps the rest', () => {
    const m = migrate(v2Save())
    expect(m['v']).toBe(4)
    expect(m['snapshot']).toMatchObject({ v: 4, deeds: [], met: [], honor: 5 })
    expect(m['checkpoint']).toMatchObject({ v: 4, deeds: [], met: [] })
    expect(migrate({ ...v2Save(), checkpoint: null })['checkpoint']).toBeNull()
  })
  it('a v2 save loads through loadSave as a valid state', () => {
    const r = loadSave(v2Save(), story)
    expect(r.ok && r.via).toBe('snapshot')
    expect(r.ok && r.save.snapshot.deeds).toEqual([])
  })
})
describe('migrate v3 -> v4 (met, D31)', () => {
  const v3State = (): Record<string, unknown> => {
    const { met: _dropped, ...rest } = play(a, cont)
    return { ...rest, v: 3, party: ['nora', 'brick'] }
  }
  const v3Save = (): Record<string, unknown> => ({ v: 3, seed: 3, bg: 'dockworker', name: 'Ash', history: ['c1.a:a', 'c1.b:>'], snapshot: v3State(), checkpoint: v3State(), savedAt: 5 })
  it('starts `met` with the party, in the snapshot and the checkpoint, and keeps the rest', () => {
    const m = migrate(v3Save())
    expect(m['v']).toBe(4)
    expect(m['snapshot']).toMatchObject({ v: 4, met: ['nora', 'brick'], party: ['nora', 'brick'] })
    expect(m['checkpoint']).toMatchObject({ v: 4, met: ['nora', 'brick'] })
    expect(migrate({ ...v3Save(), checkpoint: null })['checkpoint']).toBeNull()
  })
  it('a v3 save loads through loadSave as a valid state', () => {
    const r = loadSave(v3Save(), story)
    expect(r.ok && r.via).toBe('snapshot')
    expect(r.ok && r.save.snapshot.met).toEqual(['nora', 'brick'])
  })
  it('ignores a party entry that is not text', () => {
    expect(migrate({ ...v3Save(), snapshot: { ...v3State(), party: ['nora', 7] } })['snapshot']).toMatchObject({ met: ['nora'] })
  })
})
describe('migrate', () => {
  const table = { 1: (raw: Record<string, unknown>) => ({ ...raw, renamed: raw['old'] }), 2: (raw: Record<string, unknown>) => ({ ...raw, two: true }) }
  it('runs each step in order and bumps v', () => {
    expect(migrate({ v: 1, old: 'x' }, table, 3)).toEqual({ v: 3, old: 'x', renamed: 'x', two: true })
  })
  it('leaves a current save alone', () => {
    expect(migrate({ v: 1, a: 1 }, MIGRATIONS, 1)).toEqual({ v: 1, a: 1 })
  })
  it('rejects non-objects, missing versions, newer saves and gaps in the table', () => {
    expect(() => migrate('x')).toThrow('not an object')
    expect(() => migrate([1])).toThrow('not an object')
    expect(() => migrate(null)).toThrow('not an object')
    expect(() => migrate({})).toThrow('no version')
    expect(() => migrate({ v: 9 })).toThrow('newer than this game')
    expect(() => migrate({ v: 1 }, {}, 2)).toThrow('no migration from save v1')
  })
})
describe('replay', () => {
  const start = { seed: 3, bg: 'dockworker', name: 'Ash' }
  it('same seed + history rebuilds the same game, including rolls and logs', () => {
    const live = play({ type: 'CHOOSE', choice: 'b' }, cont, { type: 'CHOOSE', choice: 'a' })
    const re = replay(story, start, live.history)
    expect(re).toEqual({ state: live })
  })
  it('fails on an unknown background, a bad token, the wrong scene or a step that is not applied', () => {
    expect(replay(story, { ...start, bg: 'ghost' }, [])).toEqual({ error: expect.stringContaining('unknown background ghost') })
    expect(replay(story, start, ['c1.a:z'])).toEqual({ error: expect.stringContaining('does not fit') })
    expect(replay(story, start, [':a'])).toEqual({ error: expect.stringContaining('does not fit') })
    expect(replay(story, start, ['c2.a:a'])).toEqual({ error: expect.stringContaining('does not fit scene c1.a') })
    expect(replay(story, start, ['c1.a:c'])).toEqual({ error: expect.stringContaining('was not applied') })
  })
})
describe('loadSave', () => {
  it('uses a valid snapshot first', () => {
    const r = loadSave(stored(), story)
    expect(r).toMatchObject({ ok: true, via: 'snapshot' })
    if (r.ok) expect(r.save.snapshot).toEqual(play(a, cont))
  })
  it('replays seed + history when the snapshot is broken', () => {
    const raw = { ...stored(), snapshot: { nonsense: true } }
    const r = loadSave(raw, story)
    expect(r).toMatchObject({ ok: true, via: 'replay' })
    if (r.ok) expect(r.save.snapshot).toEqual(play(a, cont))
  })
  it('falls back to the chapter checkpoint when the replay fails too', () => {
    const cp = play(a)
    const raw = { ...stored(), snapshot: 7, history: ['c1.a:z'], checkpoint: JSON.parse(JSON.stringify(cp)) }
    const r = loadSave(raw, story)
    expect(r).toMatchObject({ ok: true, via: 'checkpoint' })
    if (r.ok) expect(r.save).toMatchObject({ history: cp.history, snapshot: cp, checkpoint: cp })
  })
  it('reports every reason when nothing is usable', () => {
    const r = loadSave({ ...stored(), snapshot: 7, history: ['c1.a:z'], checkpoint: { bad: 1 } }, story)
    expect(r).toEqual({ ok: false, errors: [expect.stringContaining('snapshot is invalid: '), expect.stringContaining('replay step 0'), expect.stringContaining('no usable checkpoint: ')] })
    expect(loadSave({ ...stored(), snapshot: 7, history: ['c1.a:z'], checkpoint: null }, story)).toMatchObject({ ok: false, errors: [expect.any(String), expect.any(String), 'no checkpoint'] })
    expect(loadSave(null, story)).toEqual({ ok: false, errors: ['save is not an object'] })
    expect(loadSave({ v: 1 }, story)).toMatchObject({ ok: false, errors: [expect.stringContaining('save envelope')] })
  })
})
describe('storage', () => {
  const memory = (): KeyValueStore & { data: Map<string, string> } => {
    const data = new Map<string, string>()
    return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
  }
  it('writes under rr_save_v1 and reads the same game back', () => {
    const store = memory()
    expect(readSave(store, story)).toBeUndefined()
    const save = makeSave(play(a, cont), null, story, 99)
    writeSave(store, save)
    expect(store.data.has(SAVE_KEY)).toBe(true)
    const r = readSave(store, story)
    expect(r).toMatchObject({ ok: true, via: 'snapshot' })
    if (r?.ok) expect(r.save).toEqual(save)
  })
  it('bad JSON is an error result, not a throw', () => {
    const store = memory()
    store.setItem(SAVE_KEY, '{oops')
    expect(readSave(store, story)).toEqual({ ok: false, errors: [expect.stringContaining('not valid JSON')] })
  })
})