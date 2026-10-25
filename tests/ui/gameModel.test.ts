// tests/ui/gameModel.test.ts — the UI reducer around the engine: screens, checkpoint, toasts, rejected LOAD, error fallback, playRoute; autosave and Continue
import { beforeAll, describe, expect, it } from 'vitest'
import { SAVE_KEY, makeSave } from '../../src/engine/save'
import type { Story } from '../../src/engine/types'
import { currentView } from '../../src/engine/select'
import { MAX_READ, autosave, backgroundCards, initialUi, newSeed, playRoute, savedGame, uiReducer, type UiAction, type UiState } from '../../src/ui/hooks/gameModel'
import { memoryStore } from '../../src/ui/storage'
import { loadTestChapterStory } from '../engine/testStory'
let story: Story
beforeAll(async () => {
  story = await loadTestChapterStory()
})
const run = (ui: UiState, ...actions: UiAction[]): UiState => actions.reduce(uiReducer(story), ui)
const START: UiAction = { type: 'START', bg: 'dockworker', name: 'Ash', seed: 7 }
const a: UiAction = { type: 'CHOOSE', choice: 'a' }
const d: UiAction = { type: 'CHOOSE', choice: 'd' }
describe('uiReducer', () => {
  it('starts on the title; SCREEN navigates without touching the game', () => {
    const ui = initialUi(story)
    expect(ui).toMatchObject({ screen: 'title', checkpoint: null, toasts: [] })
    const next = run(ui, { type: 'SCREEN', screen: 'background' })
    expect(next.screen).toBe('background')
    expect(next.game).toBe(ui.game)
  })
  it('START enters play on the first scene with no checkpoint', () => {
    const ui = run(initialUi(story), START)
    expect(ui).toMatchObject({ screen: 'play', checkpoint: null })
    expect(ui.game).toMatchObject({ scene: story.start, name: 'Ash', bg: 'dockworker', seed: 7 })
  })
  it('CHOOSE turns what changed into toasts', () => {
    const ui = run(initialUi(story), START, a)
    expect(ui.game.scene).toBe('t.street')
    expect(ui.toasts).toEqual(['Honor +5', '-1 Food', 'Nora will remember that'])
    expect(run(ui, { type: 'SCREEN', screen: 'title' }).toasts).toEqual([])
  })
  it('keeps each scene the player leaves as a page above the next one, with the choice taken', () => {
    const ui = run(initialUi(story), START, a)
    expect(ui.read).toHaveLength(1)
    expect(ui.read[0]?.turns.flatMap((t) => t.lines).join(' ')).toContain('Sirens')
    expect(ui.read[0]?.picked).toBeTypeOf('string')
    expect(ui.read[0]?.picked).toBe(currentView(run(initialUi(story), START).game, story).choices.find((c) => c.id === 'a')?.text)
    const two = run(ui, d)
    expect(two.read.map((c) => c.key)).toEqual([...new Set(two.read.map((c) => c.key))]) // unique keys
    expect(two.read).toHaveLength(2)
  })
  it('the page survives Menu and Settings, but START, LOAD and a rejected click start or leave it fresh', () => {
    const ui = run(initialUi(story), START, a)
    expect(run(ui, { type: 'SCREEN', screen: 'settings' }).read).toHaveLength(1)
    expect(run(ui, { type: 'SCREEN', screen: 'title' }, START).read).toEqual([])
    expect(run(ui, { type: 'CONTINUE' }).read).toHaveLength(1) // t.street is a choice scene: Continue is ignored, no new page
    expect(run(initialUi(story), START).read).toEqual([])
  })
  it('never keeps more than MAX_READ pages', () => {
    let ui = run(initialUi(story), START)
    const view = (u: UiState) => currentView(u.game, story)
    for (let i = 0; i < 400 && view(ui).kind !== 'end'; i++) {
      const v = view(ui)
      ui = run(ui, v.kind === 'choices' ? { type: 'CHOOSE', choice: v.choices.find((c) => c.enabled)?.id ?? 'a' } : { type: 'CONTINUE' })
      expect(ui.read.length).toBeLessThanOrEqual(MAX_READ)
    }
    expect(ui.read.length).toBeGreaterThan(0)
  })
  it('a gate scene becomes the checkpoint', () => {
    const ui = run(initialUi(story), START, a, d)
    expect(ui.game.scene).toBe('t.gate')
    expect(ui.checkpoint?.scene).toBe('t.gate')
  })
  it('LOAD of a valid save enters play with the save checkpoint', () => {
    const played = run(initialUi(story), START, a, d)
    const save = makeSave(played.game, played.checkpoint, story, 1)
    const loaded = run(initialUi(story), { type: 'LOAD', save })
    expect(loaded).toMatchObject({ screen: 'play', game: { scene: 't.gate' }, checkpoint: { scene: 't.gate' } })
  })
  it('a LOAD the engine rejects keeps the screen and the checkpoint', () => {
    const ui = initialUi(story)
    const bad = makeSave({ ...ui.game, scene: 'nope.nope' }, null, story, 1)
    const next = run(ui, { type: 'LOAD', save: bad })
    expect(next).toMatchObject({ screen: 'title', checkpoint: null })
    expect(next.game.log[next.game.log.length - 1]?.kind).toBe('ERROR')
  })
  it('an engine throw lands on sys.error (play screen, never blank) and keeps the old checkpoint', () => {
    const played = run(initialUi(story), START, a, d)
    const broken = run(played, { type: 'START', bg: 'nobody', name: 'x', seed: 1 })
    expect(broken).toMatchObject({ screen: 'play', game: { scene: 'sys.error' }, checkpoint: null })
    const stuck = run(played, { type: 'CAMP', action: 'eat' }) // CAMP is a stub: ignored with an ERROR log, state stays playable
    expect(stuck.game.scene).toBe('t.gate')
  })
})
describe('autosave and Continue', () => {
  it('saves after a choice and reads back what Continue shows', () => {
    const ui = run(initialUi(story), START, a, d)
    const store = memoryStore()
    expect(autosave(store, ui.game, ui.checkpoint, story, 1234)).toBeUndefined()
    const s = savedGame(store, story)
    expect(s).toMatchObject({ kind: 'ok', via: 'snapshot', chapter: 't', hud: { name: 'Ash' }, save: { savedAt: 1234 } })
    if (s.kind === 'ok') expect(s.save.checkpoint?.scene).toBe('t.gate')
  })
  it('never saves a state parked on sys.error', () => {
    const store = memoryStore()
    const broken = run(initialUi(story), { type: 'START', bg: 'nobody', name: 'x', seed: 1 })
    expect(autosave(store, broken.game, null, story, 5)).toBeUndefined()
    expect(store.getItem(SAVE_KEY)).toBeNull()
  })
  it('returns the error text when the write fails', () => {
    const ui = run(initialUi(story), START)
    const store = { getItem: () => null, setItem: () => { throw new Error('quota') } }
    expect(autosave(store, ui.game, null, story, 1)).toBe('quota')
  })
  it('savedGame: none for an empty store, broken for unreadable data', () => {
    const store = memoryStore()
    expect(savedGame(store, story)).toEqual({ kind: 'none' })
    store.setItem(SAVE_KEY, '{nope')
    expect(savedGame(store, story).kind).toBe('broken')
  })
})
describe('helpers', () => {
  it('backgroundCards lists every background with its key and hook', () => {
    const cards = backgroundCards(story)
    expect(cards.map((c) => c.key)).toEqual(['dockworker', 'mechanic', 'teacher'])
    expect(cards.every((c) => (c.hook ?? '') !== '')).toBe(true)
  })
  it('newSeed is an unsigned 32-bit integer', () => {
    const n = newSeed()
    expect(Number.isInteger(n) && n >= 0 && n <= 0xffffffff).toBe(true)
  })
})
describe('playRoute: a broken story never gives a blank screen', () => {
  const bad = { id: 'x.bad', text: 'A door that leads nowhere.', choices: [{ id: 'a' as const, text: 'Open it.', to: 'x.nowhere' }] }
  const brokenStory = (): Story => ({ ...story, start: 'x.bad', scenes: { ...story.scenes, 'x.bad': bad } }) // built per test: `story` loads in beforeAll
  it('routes a normal scene to play and an ending scene to the ending screen', () => {
    const at = (scene: string) => playRoute(currentView({ ...initialUi(story).game, scene }, story))
    expect(at('t.wake')).toBe('play')
    expect(at('t.echo')).toBe('play') // `next` scenes are play too (Continue button)
    expect(at('t.end')).toBe('ending')
    expect(at('sys.death')).toBe('ending')
  })
  it('routes a pick that targets a missing scene to the fallback (sys.missing), with its explanation text', () => {
    const broken = brokenStory()
    const ui = [START, a].reduce(uiReducer(broken), initialUi(broken))
    expect(ui.game.scene).toBe('sys.missing')
    const v = currentView(ui.game, broken)
    expect(playRoute(v)).toBe('fallback')
    expect(v.lines.length).toBeGreaterThan(0)
    expect(ui.game.log.some((e) => e.kind === 'ERROR')).toBe(true)
  })
  it('routes a state whose scene is not in the story, and sys.error, to the fallback', () => {
    expect(playRoute(currentView({ ...initialUi(story).game, scene: 'gone.scene' }, story))).toBe('fallback')
    expect(playRoute(currentView({ ...initialUi(story).game, scene: 'sys.error' }, story))).toBe('fallback')
  })
})
