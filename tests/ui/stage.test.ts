// tests/ui/stage.test.ts — the stage layout (UI_UX §3): Backdrop hook, Title menu column, Play pieces (HUD, story in the middle, dock with portrait / spoken line / Choices only while someone talks or choices are offered)
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { currentView, hudOf, type View } from '../../src/engine/select'
import type { Story } from '../../src/engine/types'
import { Backdrop } from '../../src/ui/components/Backdrop'
import { SceneView } from '../../src/ui/components/SceneView'
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
  it('a narration scene with choices has the HUD, a backdrop, the story and a dock with only the Choices panel', () => {
    const out = play('t.wake')
    for (const c of ['class="hud"', 'class="backdrop"', 'class="story"', 'class="dock"', 'class="panel"', '>Choices</h2>']) expect(out).toContain(c)
    for (const c of ['class="portrait"', 'class="textbox"', '>Continue</button>']) expect(out).not.toContain(c)
    expect(out.indexOf('class="story"')).toBeLessThan(out.indexOf('class="dock"'))
  })
  it('a `next` narration scene shows Continue under the story text and no dock', () => {
    const out = play('t.echo')
    for (const c of ['class="dock"', 'class="panel"', 'class="portrait"']) expect(out).not.toContain(c)
    const story = out.slice(out.indexOf('class="story"'))
    expect(story.indexOf('class="narration"')).toBeLessThan(story.indexOf('>Continue</button>'))
  })
  it('a speech turn shows the portrait, the line and Continue in the dock; later turns are not shown yet', () => {
    const out = play('p.dole')
    const dock = out.slice(out.indexOf('class="dock"'))
    expect(dock).toContain('class="portrait"')
    expect(dock).toContain('<span class="sil">Dole</span>')
    expect(dock.indexOf("Walt, 3B.")).toBeLessThan(dock.indexOf('>Continue</button>'))
    expect(out).not.toContain('class="panel"')
    expect(out).not.toContain('His voice is wet')
  })
  it('the last turn of a choices scene, when it is speech, has the portrait, the line and the Choices panel, and no Continue', () => {
    const view: View = { kind: 'choices', scene: 'x.a', lines: ['"Stay."'], beats: [{ text: '"Stay."', say: 'dole' }], who: ['dole'], place: 'hallway', mood: undefined, ending: undefined, choices: [{ id: 'a', text: 'Go.', tone: undefined, cost: undefined, enabled: true, why: undefined, lock: undefined, odds: undefined }] }
    const out = html(createElement(PlayScreen, { view, hud: hudOf(makeState()), step: 0, typewriter: false, toasts: [], toastSeq: 0, saveError: undefined, onChoose: noop, onNext: noop, onMenu: noop, onSettings: noop }))
    for (const c of ['class="portrait"', 'class="textbox"', 'class="panel"']) expect(out).toContain(c)
    expect(out).not.toContain('>Continue</button>')
    expect(out.indexOf('class="textbox"')).toBeLessThan(out.indexOf('class="panel"'))
  })
})
describe('SceneView: the page', () => {
  it('shows scenes already read above this one, with the choice taken, and a place caption only when the place changes', () => {
    const read = [
      { key: 1, place: 'hallway', turns: [{ who: undefined, lines: ['First scene.'] }], picked: 'Open the door.' },
      { key: 2, place: 'hallway', turns: [{ who: 'dole', lines: ['"Hi."'] }], picked: undefined },
    ]
    const out = html(createElement(SceneView, { place: 'stairs', read, now: { who: undefined, lines: ['Now.'] } }))
    const at = (s: string): number => out.indexOf(s)
    expect(at('First scene.')).toBeLessThan(at('Open the door.'))
    expect(at('Open the door.')).toBeLessThan(at('Dole'))
    expect(at('Dole')).toBeLessThan(at('Now.'))
    expect(out.match(/class="place"/g)).toHaveLength(2) // hallway once, then stairs
    expect(out).toContain('class="picked"')
  })
})
describe('SceneView', () => {
  it('keeps what a character said in the story text, with their name, after they talked', () => {
    const done = [{ who: 'dole', lines: ['"Hey."'] }, { who: undefined, lines: ['He knocks.'] }]
    const out = html(createElement(SceneView, { place: 'hallway', done, now: { who: undefined, lines: ['Silence.'] } }))
    expect(out).toContain('<div class="said"><span class="by">Dole</span><p>&quot;Hey.&quot;</p></div>')
    expect(out.indexOf('Dole')).toBeLessThan(out.indexOf('He knocks.'))
    expect(out.indexOf('He knocks.')).toBeLessThan(out.indexOf('Silence.'))
  })
})
