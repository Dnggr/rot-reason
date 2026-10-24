// tests/ui/stage.test.ts — the stage layout (UI_UX §3): Backdrop hook, Title menu column, Play pieces (HUD, portrait, text box, Choices panel, Continue inside the text box)
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { currentView, hudOf } from '../../src/engine/select'
import type { Story } from '../../src/engine/types'
import { Backdrop } from '../../src/ui/components/Backdrop'
import { PlayScreen } from '../../src/ui/screens/PlayScreen'
import { TitleScreen } from '../../src/ui/screens/TitleScreen'
import { makeState } from '../engine/fixtures'
import { loadTestChapterStory } from '../engine/testStory'
let story: Story
beforeAll(async () => {
  story = await loadTestChapterStory()
})
const html = (el: ReactElement): string => renderToStaticMarkup(el)
const noop = (): void => undefined
const play = (scene: string): string => {
  const view = currentView(makeState({ scene }), story)
  return html(createElement(PlayScreen, { view, hud: hudOf(makeState()), step: 0, typewriter: false, toasts: [], toastSeq: 0, saveError: undefined, onChoose: noop, onNext: noop, onMenu: noop, onSettings: noop }))
}
describe('Backdrop', () => {
  it('points at /bg/<name>.webp and strips anything unsafe from the name', () => {
    const out = html(createElement(Backdrop, { name: 'old_pier' }))
    expect(out).toContain('--bg-img:url(/bg/old_pier.webp)')
    expect(out).toContain('aria-hidden="true"')
    expect(html(createElement(Backdrop, { name: 'a/../b")x' }))).toContain('url(/bg/abx.webp)')
  })
  it('is a plain gradient layer with no image when there is no name', () => {
    const out = html(createElement(Backdrop, { name: undefined }))
    expect(out).toContain('class="backdrop"')
    expect(out).not.toContain('--bg-img')
  })
})
describe('Title stage', () => {
  it('puts the title and its buttons in the left menu column over the title backdrop', () => {
    const out = html(createElement(TitleScreen, { saved: { kind: 'none' }, persistent: true, onNew: noop, onContinue: noop, onSettings: noop }))
    expect(out).toContain('class="stage title"')
    expect(out).toContain('url(/bg/title.webp)')
    expect(out).toMatch(/class="title-menu"><h1>Rot &amp; Reason<\/h1>/)
    expect(out.indexOf('New game')).toBeLessThan(out.indexOf('>Settings</button>'))
  })
})
describe('Play stage', () => {
  it('a choices scene has the HUD, a backdrop, a text box and a Choices panel; Continue is not shown', () => {
    const out = play('t.wake')
    for (const c of ['class="hud"', 'class="backdrop"', 'class="textbox"', 'class="panel"', '>Choices</h2>', 'class="portrait"']) expect(out).toContain(c)
    expect(out).not.toContain('>Continue</button>')
  })
  it('a `next` scene shows Continue inside the text box and no Choices panel', () => {
    const out = play('t.echo')
    expect(out).not.toContain('class="panel"')
    const box = out.slice(out.indexOf('class="textbox"'))
    expect(box).toContain('>Continue</button>')
    expect(box.indexOf('class="narration"')).toBeLessThan(box.indexOf('>Continue</button>'))
  })
})
