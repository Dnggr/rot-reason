// tests/ui/render.test.ts — UI smoke: each screen and component renders to markup (react-dom/server, no DOM needed) with the words the player must see
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { currentView, hudOf, type ChoiceView } from '../../src/engine/select'
import type { Story } from '../../src/engine/types'
import { ChoiceButton } from '../../src/ui/components/ChoiceButton'
import { ErrorBoundary } from '../../src/ui/components/ErrorBoundary'
import { ErrorFallback } from '../../src/ui/components/ErrorFallback'
import { HonorMeter } from '../../src/ui/components/HonorMeter'
import { StatBar } from '../../src/ui/components/StatBar'
import { Game } from '../../src/ui/Game'
import { backgroundCards, initialUi, savedGame, uiReducer } from '../../src/ui/hooks/gameModel'
import { BackgroundScreen } from '../../src/ui/screens/BackgroundScreen'
import { EndingScreen } from '../../src/ui/screens/EndingScreen'
import { PlayScreen } from '../../src/ui/screens/PlayScreen'
import { TitleScreen } from '../../src/ui/screens/TitleScreen'
import { memoryStore } from '../../src/ui/storage'
import { loadTestChapterStory } from '../engine/testStory'
import { makeState } from '../engine/fixtures'
let story: Story
beforeAll(async () => {
  story = await loadTestChapterStory()
})
const html = (el: ReactElement): string => renderToStaticMarkup(el)
const noop = (): void => undefined
const choice = (over: Partial<ChoiceView>): ChoiceView => ({ id: 'a', text: 'Do it.', tone: undefined, cost: undefined, enabled: true, why: undefined, lock: undefined, odds: undefined, ...over })
describe('components', () => {
  it('ChoiceButton shows tone, cost and odds chips', () => {
    const out = html(createElement(ChoiceButton, { choice: choice({ tone: 'brave', cost: { food: 2 }, odds: 'risky' }), onPick: noop }))
    expect(out).toContain('Brave')
    expect(out).toContain('-2 Food')
    expect(out).toContain('Risky')
    expect(out).toContain('aria-disabled="false"')
  })
  it('ChoiceButton shows why a choice is locked, and when it is unaffordable', () => {
    const locked = html(createElement(ChoiceButton, { choice: choice({ enabled: false, why: 'lock', lock: ['trait', 'Medic'] }), onPick: noop }))
    expect(locked).toContain('Needs Medic')
    expect(locked).toContain('aria-disabled="true"')
    expect(html(createElement(ChoiceButton, { choice: choice({ enabled: false, why: 'lock', lock: undefined }), onPick: noop }))).toContain('Locked')
    expect(html(createElement(ChoiceButton, { choice: choice({ enabled: false, why: 'cost', cost: { ammo: 1 } }), onPick: noop }))).toContain('Not enough')
  })
  it('StatBar shows day, HP, Reason and resources; Rot only above 0', () => {
    const hud = hudOf(makeState({ day: 3, phase: 'dusk', stats: { hp: 3, reason: 72, rot: 0 } }))
    const out = html(createElement(StatBar, { hud }))
    expect(out).toContain('Day 3 Dusk')
    expect(out).toContain('HP 3 of 5')
    expect(out).toContain('Reason 72')
    expect(out).toContain('Food 3')
    expect(out).not.toContain('Rot ')
    expect(html(createElement(StatBar, { hud: { ...hud, stats: { ...hud.stats, rot: 8 } } }))).toContain('Rot 8')
  })
  it('HonorMeter names the tier and exposes the value', () => {
    const out = html(createElement(HonorMeter, { honor: -70, tier: 'T1' }))
    expect(out).toContain('Infamous')
    expect(out).toContain('aria-valuenow="-70"')
    expect(html(createElement(HonorMeter, { honor: 30, tier: 'T4' }))).toContain('Respected')
  })
  it('ErrorFallback offers Copy debug report and its actions', () => {
    const out = html(createElement(ErrorFallback, { title: 'Oops', lines: ['It broke.'], report: () => '{}', actions: [{ label: 'Reload', onClick: noop }] }))
    expect(out).toContain('Oops')
    expect(out).toContain('Copy debug report')
    expect(out).toContain('Reload')
  })
  it('ErrorBoundary shows "Something broke" with the report button once it has caught an error', () => {
    const b = new ErrorBoundary({ children: null, stateRef: { current: undefined } })
    expect(b.render()).toBeNull()
    b.state = ErrorBoundary.getDerivedStateFromError(new Error('boom'))
    const out = html(b.render() as ReactElement)
    expect(out).toContain('Something broke')
    expect(out).toContain('Copy debug report')
  })
})
describe('screens', () => {
  it('TitleScreen: New game alone, with Continue (day, chapter, tier) when a save exists, and the warnings', () => {
    expect(html(createElement(TitleScreen, { saved: { kind: 'none' }, persistent: true, onNew: noop, onContinue: noop, onSettings: noop }))).not.toContain('Continue')
    const played = [{ type: 'START', bg: 'dockworker', name: 'Ash', seed: 7 } as const].reduce(uiReducer(story), initialUi(story))
    const store = memoryStore()
    store.setItem('rr_save_v1', JSON.stringify({ v: 1, seed: 7, bg: 'dockworker', name: 'Ash', history: [], snapshot: played.game, checkpoint: null, savedAt: 1 }))
    const out = html(createElement(TitleScreen, { saved: savedGame(store, story), persistent: false, onNew: noop, onContinue: noop, onSettings: noop }))
    expect(out).toContain('Continue')
    expect(out).toContain('Ash · Day 1 Dawn · Chapter t · Unknown')
    expect(out).toContain('blocks saving')
    expect(html(createElement(TitleScreen, { saved: { kind: 'broken', errors: ['x'] }, persistent: true, onNew: noop, onContinue: noop, onSettings: noop }))).toContain('could not be loaded')
  })
  it('BackgroundScreen lists every background with attributes, trait, kit and hook', () => {
    const out = html(createElement(BackgroundScreen, { cards: backgroundCards(story), onBegin: noop, onBack: noop }))
    for (const name of ['Dockworker', 'Mechanic', 'Teacher']) expect(out).toContain(name)
    expect(out).toContain('Grit 4 · Wits 2 · Heart 3')
    expect(out).toContain('Trait: Hauler · Kit: 1 Food')
    expect(out).toContain('You know Pier 9')
    expect(out).toContain('placeholder="Ash"')
  })
  it('PlayScreen shows the opening scene: narration and its choices with cost and odds (nobody talks, so no portrait)', () => {
    const ui = [{ type: 'START', bg: 'dockworker', name: 'Ash', seed: 7 } as const].reduce(uiReducer(story), initialUi(story))
    const view = currentView(ui.game, story)
    const out = html(createElement(PlayScreen, { view, hud: hudOf(ui.game), step: 0, typewriter: false, toasts: ['Honor +5'], toastSeq: 1, saveError: 'quota', onChoose: noop, onNext: noop, onMenu: noop, onSettings: noop }))
    expect(out).toContain('Sirens drag you out of sleep')
    expect(out).not.toContain('class="portrait"')
    expect(out).toContain('-1 Food')
    expect(out).toContain('Honor +5')
    expect(out).toContain('Could not save')
    expect(out).toContain('mood-tense')
  })
  it('PlayScreen shows Continue on a scene that only has `next`', () => {
    const view = currentView(makeState({ scene: 't.echo' }), story)
    expect(view.kind).toBe('next')
    const out = html(createElement(PlayScreen, { view, hud: hudOf(makeState()), step: 0, typewriter: false, toasts: [], toastSeq: 0, saveError: undefined, onChoose: noop, onNext: noop, onMenu: noop, onSettings: noop }))
    expect(out).toContain('Continue')
  })
  it('EndingScreen shows the ending title, the epilogue text and the recap', () => {
    const state = makeState({ scene: 't.end', honor: 0 })
    const view = currentView(state, story)
    expect(view.ending).toBe('last_seat')
    const out = html(createElement(EndingScreen, { view, hud: hudOf(state), onNew: noop, onTitle: noop }))
    expect(out).toContain('Last Seat')
    expect(out).toContain('A ship horn sounds')
    expect(out).toContain('Unknown (0)')
    expect(html(createElement(EndingScreen, { view: { ...view, ending: 'death' }, hud: hudOf(state), onNew: noop, onTitle: noop }))).toContain('You did not make it')
  })
  it('Game renders the title screen first (exercises useGame wiring)', () => {
    const out = html(createElement(Game, { story, persist: { store: memoryStore(), persistent: true }, stateRef: { current: undefined } }))
    expect(out).toContain('Rot &amp; Reason')
    expect(out).toContain('New game')
  })
})