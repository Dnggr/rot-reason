// tests/ui/journalUi.test.ts — Journal, Party cards, tier banner (M3 s2, D30), plus the three M3 s1 UI/engine bug fixes: scroll key, nested header, perks
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { journalOf, type JournalView } from '../../src/engine/journal'
import { currentView, hudOf } from '../../src/engine/select'
import type { Story } from '../../src/engine/types'
import { CharacterCard } from '../../src/ui/components/CharacterCard'
import { StatBar } from '../../src/ui/components/StatBar'
import { TierBanner } from '../../src/ui/components/TierBanner'
import { initialUi, MAX_READ, uiReducer, type UiAction, type UiState } from '../../src/ui/hooks/gameModel'
import { JournalScreen } from '../../src/ui/screens/JournalScreen'
import { PlayScreen } from '../../src/ui/screens/PlayScreen'
import { tierBanner } from '../../src/ui/tiers'
import { scrollKey, type ReadChunk } from '../../src/ui/turns'
import { makeState } from '../engine/fixtures'
import { makeStory } from '../engine/storyFixture'
import { loadTestChapterStory } from '../engine/testStory'
const html = (el: ReactElement): string => renderToStaticMarkup(el)
const noop = (): void => undefined
let real: Story
beforeAll(async () => {
  real = await loadTestChapterStory()
})
const lines = { T1: 'one', T2: 'two', T3: 'three', T4: 'four', T5: 'five' } as const
const journal: JournalView = {
  deeds: [
    { tag: 'kill_surrender', witnessed: true, surfaced: false, day: 2, delta: -12, who: [{ id: 'nora', delta: -10 }, { id: 'hart', delta: -10 }] },
    { tag: 'steal', witnessed: false, surfaced: false, day: 1, delta: -3, who: [] },
    { tag: 'steal', witnessed: false, surfaced: true, day: 2, delta: 0, who: [{ id: 'hart', delta: -10 }] },
  ],
  people: [
    { id: 'nora', name: 'Nora Vance', alive: true, inParty: true, trust: 25, fear: 0, perk: undefined },
    { id: 'brick', name: 'Dominic "Brick" Salazar', alive: true, inParty: true, trust: -40, fear: 60, perk: 'Grit checks +2 while he is with you.' },
    { id: 'juno', name: 'Juno Park', alive: false, inParty: false, trust: 5, fear: 0, perk: 'Wits checks +1 while she is with you.' },
  ],
}
describe('JournalScreen', () => {
  it('Deeds tab: newest first as given, seen / unseen / came out, honor, day and who reacted', () => {
    const out = html(createElement(JournalScreen, { journal, onBack: noop }))
    expect(out).toContain('role="dialog"')
    expect(out).toContain('Kill surrender')
    for (const w of ['Seen', 'Unseen', 'Came out', 'Honor -12', 'No change in honor', 'Day 2', 'Reacted: Nora -10, Hart -10']) expect(out).toContain(w)
    expect(out).toMatch(/aria-selected="true"[^>]*>Deeds/)
  })
  it('says so when there are no deeds yet', () => {
    expect(html(createElement(JournalScreen, { journal: { deeds: [], people: [] }, onBack: noop }))).toContain('Nothing yet')
  })
})
describe('CharacterCard', () => {
  it('shows name, with-you chip, trust and fear as numbers and meters, and the perk', () => {
    const out = html(createElement(CharacterCard, { person: journal.people[1]! }))
    for (const w of ['Brick', 'Dominic', 'With you', 'Trust -40', 'Fear 60', 'Grit checks +2', 'role="meter"']) expect(out).toContain(w)
    expect(out).toContain("Brick&#x27;s trust -40 of 100")
  })
  it('marks the dead and shows no perk line when there is none', () => {
    expect(html(createElement(CharacterCard, { person: journal.people[2]! }))).toContain('Dead')
    const nora = html(createElement(CharacterCard, { person: journal.people[0]! }))
    expect(nora).not.toContain('Perk')
    expect(nora).not.toContain('Dead')
  })
})
describe('tier banner', () => {
  it('tierBanner: only when the tier changes, one banner for the tier honor ends in', () => {
    expect(tierBanner(makeState({ honor: 0 }), makeState({ honor: 20 }), lines)).toBeUndefined()
    expect(tierBanner(makeState({ honor: 20 }), makeState({ honor: 21 }), lines)).toEqual({ tier: 'T4', text: 'four' })
    expect(tierBanner(makeState({ honor: 0 }), makeState({ honor: -25 }), lines)).toEqual({ tier: 'T2', text: 'two' })
    expect(tierBanner(makeState({ honor: 50 }), makeState({ honor: -70 }), lines)).toEqual({ tier: 'T1', text: 'one' })
  })
  it('TierBanner renders the tier word, the line and a Continue button as a dialog', () => {
    const out = html(createElement(TierBanner, { banner: { tier: 'T2', text: 'People begin to whisper your name.' }, onDismiss: noop }))
    for (const w of ['Feared', 'People begin to whisper your name.', 'Continue', 'role="alertdialog"']) expect(out).toContain(w)
  })
  const story = makeStory([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'Give.', fx: [['honor', 'sacrifice', true]], to: 'c1.b' }] }, { id: 'c1.b', text: 'y', choices: [{ id: 'a', text: 'Again.', to: 'c1.c' }] }, { id: 'c1.c', text: 'z', end: 'auto' }])
  const run = (ui: UiState, ...a: UiAction[]): UiState => a.reduce(uiReducer(story), ui)
  const started = (): UiState => run(initialUi(story), { type: 'START', bg: 'dockworker', name: 'Ash', seed: 7 })
  it('uiReducer sets the banner when a choice moves honor into a new tier, BANNER_OFF clears it, a quiet choice sets none', () => {
    const ui = started()
    const near: UiState = { ...ui, game: { ...ui.game, honor: 15 } }
    const after = run(near, { type: 'CHOOSE', choice: 'a' })
    expect(after.game.honor).toBe(27)
    expect(after.banner).toEqual({ tier: 'T4', text: 'four' })
    expect(run(after, { type: 'BANNER_OFF' }).banner).toBeUndefined()
    expect(run(after, { type: 'SCREEN', screen: 'settings' }).banner).toEqual(after.banner) // Settings does not eat it
    expect(run(after, { type: 'BANNER_OFF' }, { type: 'CHOOSE', choice: 'a' }).banner).toBeUndefined()
    expect(started().banner).toBeUndefined()
  })
  it('a new game, a load or a rewind drops a pending banner', () => {
    const ui = started()
    const after = run({ ...ui, game: { ...ui.game, honor: 15 } }, { type: 'CHOOSE', choice: 'a' })
    expect(run(after, { type: 'START', bg: 'dockworker', name: 'Ash', seed: 7 }).banner).toBeUndefined()
  })
  it('the journal screen keeps the game and remembers where it came from', () => {
    const ui = started()
    const open = run(ui, { type: 'SCREEN', screen: 'journal' })
    expect(open).toMatchObject({ screen: 'journal', from: 'play' })
    expect(open.game).toBe(ui.game)
    expect(run(open, { type: 'SCREEN', screen: 'play' }).screen).toBe('play')
  })
})
describe('PlayScreen with overlays', () => {
  const ui = (): UiState => [{ type: 'START', bg: 'dockworker', name: 'Ash', seed: 7 } as const].reduce(uiReducer(real), initialUi(real))
  const props = (): Parameters<typeof PlayScreen>[0] => {
    const u = ui()
    return { view: currentView(u.game, real), hud: hudOf(u.game), step: 0, typewriter: false, toasts: [], toastSeq: 0, saveError: undefined, onChoose: noop, onNext: noop, onMenu: noop, onSettings: noop }
  }
  it('has a Journal button, no overlay and a live page by default', () => {
    const out = html(createElement(PlayScreen, props()))
    expect(out).toContain('>Journal</button>')
    expect(out).not.toContain('role="dialog"')
    expect(out).not.toContain('inert')
  })
  it('draws the Journal over the page and makes the page behind inert', () => {
    const p = props()
    const out = html(createElement(PlayScreen, { ...p, journal: journalOf(ui().game, real) }))
    expect(out).toContain('role="dialog"')
    expect(out).toContain('inert')
    expect(out).toContain('Sirens drag you out of sleep') // the scene is still there underneath
  })
  it('draws the tier banner over the page, and the Journal wins when both are set', () => {
    const p = props()
    const withBanner = html(createElement(PlayScreen, { ...p, banner: { tier: 'T4', text: 'Strangers nod as you pass, and mean it.' } }))
    expect(withBanner).toContain('Strangers nod as you pass')
    expect(withBanner).toContain('inert')
    expect(html(createElement(PlayScreen, { ...p, banner: { tier: 'T4', text: 'banner text' }, journal: journal }))).not.toContain('banner text')
  })
})
describe('bug fixes from the M3 s1 review', () => {
  const chunk = (key: number): ReadChunk => ({ key, place: undefined, turns: [], picked: undefined })
  it('scroll key changes for every scene even when the page is full (it was read.length * 1000 and repeated)', () => {
    const full = (newest: number): ReadChunk[] => Array.from({ length: MAX_READ }, (_, i) => chunk(newest - MAX_READ + 1 + i))
    const seen = new Set<number>()
    for (let step = 40; step < 60; step++) seen.add(scrollKey(full(step), 0, true))
    expect(seen.size).toBe(20)
    expect(scrollKey(full(50), 1, true)).not.toBe(scrollKey(full(50), 0, true))
    expect(scrollKey([], 0, false)).toBe(0)
  })
  it('the HUD has exactly one <header> (the stat bar); the outer wrapper is a div', () => {
    const u = [{ type: 'START', bg: 'dockworker', name: 'Ash', seed: 7 } as const].reduce(uiReducer(real), initialUi(real))
    const p = { view: currentView(u.game, real), hud: hudOf(u.game), step: 0, typewriter: false, toasts: [], toastSeq: 0, saveError: undefined, onChoose: noop, onNext: noop, onMenu: noop, onSettings: noop }
    const out = html(createElement(PlayScreen, p))
    expect(out.match(/<header/g)).toHaveLength(1)
    expect(out).toContain('<div class="hud">')
    expect(html(createElement(StatBar, { hud: p.hud }))).toContain('<header class="statbar">')
  })
})