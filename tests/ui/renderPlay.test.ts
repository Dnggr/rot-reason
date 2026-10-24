// tests/ui/renderPlay.test.ts — render checks for this session's UI: SettingsScreen, the typewriter markup, hotkeys, low-vitals visuals, the Title's Settings button, the debug slot in Game
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { currentView, hudOf } from '../../src/engine/select'
import type { Story } from '../../src/engine/types'
import { ChoiceButton } from '../../src/ui/components/ChoiceButton'
import { SceneView } from '../../src/ui/components/SceneView'
import type { DebugApi } from '../../src/ui/debugApi'
import { Game } from '../../src/ui/Game'
import { initialUi, uiReducer } from '../../src/ui/hooks/gameModel'
import { PlayScreen } from '../../src/ui/screens/PlayScreen'
import { SettingsScreen } from '../../src/ui/screens/SettingsScreen'
import { TitleScreen } from '../../src/ui/screens/TitleScreen'
import { defaultSettings } from '../../src/ui/settings'
import { memoryStore } from '../../src/ui/storage'
import { makeState } from '../engine/fixtures'
import { loadTestChapterStory } from '../engine/testStory'
let story: Story
beforeAll(async () => {
  story = await loadTestChapterStory()
})
const html = (el: ReactElement): string => renderToStaticMarkup(el)
const noop = (): void => undefined
const settingsProps = { settings: defaultSettings(), damaged: false, saveError: undefined, canReset: true, hasSave: true, onChange: noop, onReset: noop, onBack: noop }
describe('SettingsScreen', () => {
  it('lists the four text sizes with the current one checked, and every toggle with its hint', () => {
    const out = html(createElement(SettingsScreen, { ...settingsProps, settings: { ...defaultSettings(), textSize: 'L', highContrast: true } }))
    for (const w of ['Settings', 'Text size', 'Soften violence', 'Reduce motion', 'High contrast', 'Sound', 'No typing effect', 'no audio yet']) expect(out).toContain(w)
    expect(out).toMatch(/aria-checked="true"[^>]*aria-label="Large"/)
    expect(out.match(/aria-checked="false"/g)).toHaveLength(3)
    expect(out.match(/type="checkbox"/g)).toHaveLength(4)
    expect(out).toMatch(/<input type="checkbox" checked=""[^>]*\/><span>High contrast/)
  })
  it('offers Reset saved game from the title only when a save exists; otherwise says why not', () => {
    expect(html(createElement(SettingsScreen, settingsProps))).toContain('Reset saved game</button>')
    expect(html(createElement(SettingsScreen, { ...settingsProps, hasSave: false }))).toContain('no saved game to erase')
    const fromPlay = html(createElement(SettingsScreen, { ...settingsProps, canReset: false }))
    expect(fromPlay).toContain('open Settings from the title screen')
    expect(fromPlay).not.toContain('Reset saved game</button>')
  })
  it('shows a notice when settings were damaged or could not be saved', () => {
    expect(html(createElement(SettingsScreen, { ...settingsProps, damaged: true }))).toContain('could not be read')
    expect(html(createElement(SettingsScreen, { ...settingsProps, saveError: 'quota' }))).toContain('Could not save your settings')
    expect(html(createElement(SettingsScreen, settingsProps))).not.toContain('role="alert"')
  })
})
describe('typewriter markup', () => {
  it('SceneView keeps the whole text in the DOM and hides only the tail', () => {
    const now = { who: undefined, lines: ['Hello', 'World'] }
    const mid = html(createElement(SceneView, { place: undefined, now, revealed: 3 }))
    expect(mid).toContain('<p>Hel<span class="tw-rest">lo</span></p>')
    expect(mid).toContain('<p><span class="tw-rest">World</span></p>')
    const full = html(createElement(SceneView, { place: undefined, now }))
    expect(full).toContain('<p>Hello</p>')
    expect(full).not.toContain('tw-rest')
  })
  it('PlayScreen with the typewriter on starts hidden (text still present); with it off shows everything', () => {
    const ui = [{ type: 'START', bg: 'dockworker', name: 'Ash', seed: 7 } as const].reduce(uiReducer(story), initialUi(story))
    const view = currentView(ui.game, story)
    const props = { view, hud: hudOf(ui.game), step: 0, toasts: [], toastSeq: 0, saveError: undefined, onChoose: noop, onNext: noop, onMenu: noop, onSettings: noop }
    const on = html(createElement(PlayScreen, { ...props, typewriter: true }))
    expect(on).toContain('tw-rest')
    expect(on).toContain('Sirens drag you out of sleep')
    expect(html(createElement(PlayScreen, { ...props, typewriter: false }))).not.toContain('tw-rest')
  })
})
describe('play screen details', () => {
  it('numbers the choices for the 1-4 keys and offers Settings next to Menu', async () => {
    const real = currentView(makeState({ scene: 't.wake' }), story)
    const out = html(createElement(PlayScreen, { view: real, hud: hudOf(makeState()), step: 1, typewriter: false, toasts: [], toastSeq: 0, saveError: undefined, onChoose: noop, onNext: noop, onMenu: noop, onSettings: noop }))
    expect(out).toContain('aria-keyshortcuts="1"')
    expect(out).toContain('<span class="hotkey" aria-hidden="true">1</span>')
    expect(out).toContain('>Settings</button>')
    expect(out).toContain('>Menu</button>')
  })
  it('ChoiceButton without a hotkey shows no number', () => {
    expect(html(createElement(ChoiceButton, { choice: { id: 'a', text: 'Go.', tone: undefined, cost: undefined, enabled: true, why: undefined, lock: undefined, odds: undefined }, onPick: noop }))).not.toContain('hotkey')
  })
  it('low HP adds the vignette; low Reason adds the flicker class; healthy shows neither', () => {
    const real = currentView(makeState({ scene: 't.wake' }), story)
    const at = (hp: number, reason: number): string => html(createElement(PlayScreen, { view: real, hud: hudOf(makeState({ stats: { hp, reason, rot: 0 } })), step: 0, typewriter: false, toasts: [], toastSeq: 0, saveError: undefined, onChoose: noop, onNext: noop, onMenu: noop, onSettings: noop }))
    expect(at(2, 80)).toContain('class="vignette"')
    expect(at(5, 29)).toContain('lowreason')
    const ok = at(5, 80)
    expect(ok).not.toContain('vignette')
    expect(ok).not.toContain('lowreason')
  })
})
describe('Title and the debug slot', () => {
  it('TitleScreen has a Settings button', () => {
    expect(html(createElement(TitleScreen, { saved: { kind: 'none' }, persistent: true, onNew: noop, onContinue: noop, onSettings: noop }))).toContain('>Settings</button>')
  })
  it('Game mounts the debug panel only when one is passed, and gives it the live game', () => {
    const persist = { store: memoryStore(), persistent: true }
    const seen: DebugApi[] = []
    const Panel = (api: DebugApi): ReactElement => {
      seen.push(api)
      return createElement('aside', { id: 'panel' }, api.game.scene)
    }
    expect(html(createElement(Game, { story, persist, stateRef: { current: undefined } }))).not.toContain('id="panel"')
    const out = html(createElement(Game, { story, persist, stateRef: { current: undefined }, debugPanel: Panel }))
    expect(out).toContain('id="panel"')
    expect(seen[0]).toMatchObject({ playing: false })
    expect(seen[0]?.story).toBe(story)
    expect(seen[0]?.report('my note')).toContain('"note": "my note"')
  })
})
