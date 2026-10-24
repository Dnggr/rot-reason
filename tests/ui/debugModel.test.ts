// tests/ui/debugModel.test.ts — the UI reducer's side of Settings and the debug panel: where Settings returns to, DEBUG_* only when debug is on, rewind (and its refusals), save erase
import { beforeAll, describe, expect, it } from 'vitest'
import { SAVE_KEY } from '../../src/engine/save'
import type { Story } from '../../src/engine/types'
import { eraseSave, hasSave, initialUi, uiReducer, type UiAction, type UiState } from '../../src/ui/hooks/gameModel'
import { memoryStore } from '../../src/ui/storage'
import { loadTestChapterStory } from '../engine/testStory'
let story: Story
beforeAll(async () => {
  story = await loadTestChapterStory()
})
const START: UiAction = { type: 'START', bg: 'dockworker', name: 'Ash', seed: 7 }
const a: UiAction = { type: 'CHOOSE', choice: 'a' }
const d: UiAction = { type: 'CHOOSE', choice: 'd' }
const play = (debug: boolean, ...actions: UiAction[]): UiState => actions.reduce(uiReducer(story, debug), initialUi(story))
const lastLog = (ui: UiState): string => ui.game.log[ui.game.log.length - 1]?.text ?? ''
describe('Settings navigation', () => {
  it('opened from the title it returns to the title; opened from play it returns to the same game', () => {
    const t = play(false, { type: 'SCREEN', screen: 'settings' })
    expect([t.screen, t.from]).toEqual(['settings', 'title'])
    const p = play(false, START, a, { type: 'SCREEN', screen: 'settings' })
    expect([p.screen, p.from]).toEqual(['settings', 'play'])
    const back = uiReducer(story)(p, { type: 'SCREEN', screen: p.from })
    expect(back.screen).toBe('play')
    expect(back.game).toBe(p.game) // nothing was replayed or reset
    expect(back.game.scene).toBe('t.street')
  })
})
describe('DEBUG_* are dropped unless debug is on', () => {
  const actions: UiAction[] = [{ type: 'DEBUG_JUMP', scene: 't.end' }, { type: 'DEBUG_SET', patch: { kind: 'honor', value: 50 } }, { type: 'DEBUG_ROLL', roll: 6 }, { type: 'DEBUG_REWIND' }]
  it('returns the very same state, with no log line', () => {
    const ui = play(false, START, a)
    for (const act of actions) expect(uiReducer(story, false)(ui, act)).toBe(ui)
  })
  it('with debug on each one reaches the engine (or the rewind)', () => {
    const ui = play(true, START, a)
    expect(uiReducer(story, true)(ui, actions[0] as UiAction).game.scene).toBe('t.end')
    expect(uiReducer(story, true)(ui, actions[1] as UiAction).game.honor).toBe(50)
    expect(lastLog(uiReducer(story, true)(ui, actions[2] as UiAction))).toBe('next d6 will be 6')
    expect(uiReducer(story, true)(ui, actions[3] as UiAction).game.scene).toBe('t.wake')
  })
  it('a debug jump keeps the screen, clears toasts and moves the checkpoint at a gate scene', () => {
    const ui = play(true, START, a)
    expect(ui.toasts.length).toBeGreaterThan(0)
    const j = uiReducer(story, true)(ui, { type: 'DEBUG_JUMP', scene: 't.gate' })
    expect([j.screen, j.toasts, j.checkpoint?.scene]).toEqual(['play', [], 't.gate'])
  })
})
describe('rewind', () => {
  it('undoes the last step: the scene, the history and the effects (honor, food) come back; the log keeps what happened', () => {
    const ui = play(true, START, a)
    expect(ui.game.honor).toBe(5)
    const r = uiReducer(story, true)(ui, { type: 'DEBUG_REWIND' })
    expect(r.game).toMatchObject({ scene: 't.wake', history: [], honor: 0 })
    expect(lastLog(r)).toBe('rewind t.wake:a -> t.wake')
    expect(r.game.log.some((e) => e.text === 't.wake:a')).toBe(true) // the undone CHOICE line is still in the log
    expect(r.toasts).toEqual([])
  })
  it('can be repeated back to the start, then refuses: nothing to undo', () => {
    const r2 = play(true, START, a, d, { type: 'DEBUG_REWIND' }, { type: 'DEBUG_REWIND' })
    expect([r2.game.scene, r2.game.history]).toEqual(['t.wake', []])
    const r3 = uiReducer(story, true)(r2, { type: 'DEBUG_REWIND' })
    expect(r3.game.scene).toBe('t.wake')
    expect(lastLog(r3)).toBe('refused rewind: nothing to undo')
  })
  it('drops a checkpoint that lies after the rewound point, and keeps one that does not', () => {
    const gate = play(true, START, a, d)
    expect(gate.checkpoint?.scene).toBe('t.gate')
    expect(uiReducer(story, true)(gate, { type: 'DEBUG_REWIND' }).checkpoint).toBeNull()
    const earlier = { ...play(true, START, a), checkpoint: play(true, START).game } // a checkpoint from before the step
    expect(uiReducer(story, true)(earlier, { type: 'DEBUG_REWIND' }).checkpoint?.history).toEqual([])
  })
  it('refuses an edited run (set / jump), says why, and changes nothing else', () => {
    for (const edit of [{ type: 'DEBUG_SET', patch: { kind: 'honor', value: 50 } }, { type: 'DEBUG_JUMP', scene: 't.gate' }] as const) {
      const ui = play(true, START, a, edit)
      const r = uiReducer(story, true)(ui, { type: 'DEBUG_REWIND' })
      expect(r.game.scene).toBe(ui.game.scene)
      expect(r.game.history).toEqual(ui.game.history)
      expect(lastLog(r)).toContain('refused rewind: the run was edited')
    }
  })
  it('works on a game that was loaded from a save (the state is parsed in another key order)', () => {
    const played = play(true, START, a, d)
    const loaded = uiReducer(story, true)(initialUi(story), { type: 'LOAD', save: { v: 1, seed: 7, bg: 'dockworker', name: 'Ash', history: played.game.history, snapshot: JSON.parse(JSON.stringify(played.game)), checkpoint: null, savedAt: 1 } })
    const r = uiReducer(story, true)(loaded, { type: 'DEBUG_REWIND' })
    expect(r.game.scene).toBe('t.street')
    expect(lastLog(r)).toContain('rewind')
  })
})
describe('save erase', () => {
  it('hasSave sees the autosave key; eraseSave removes it and nothing else', () => {
    const store = memoryStore()
    expect(hasSave(store)).toBe(false)
    store.setItem(SAVE_KEY, '{}')
    store.setItem('rr_settings_v1', '{}')
    expect(hasSave(store)).toBe(true)
    eraseSave(store)
    expect(hasSave(store)).toBe(false)
    expect(store.getItem('rr_settings_v1')).toBe('{}')
  })
})
