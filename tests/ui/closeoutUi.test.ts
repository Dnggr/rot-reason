// tests/ui/closeoutUi.test.ts — M3 s3 (D31) UI bug fixes: a spoken line is announced once (aria-live), New game asks for a second tap on the Ending and in the error fallback, as it does on the Title
import { Children, createElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { reduce } from '../../src/engine/reducer'
import { makeSave, writeSave } from '../../src/engine/save'
import { hudOf, type View } from '../../src/engine/select'
import type { Story } from '../../src/engine/types'
import { ConfirmButton } from '../../src/ui/components/ConfirmButton'
import { ErrorFallback } from '../../src/ui/components/ErrorFallback'
import { SceneView } from '../../src/ui/components/SceneView'
import { tap } from '../../src/ui/confirm'
import { fallbackActions } from '../../src/ui/fallback'
import { savedGame } from '../../src/ui/hooks/gameModel'
import { EndingScreen } from '../../src/ui/screens/EndingScreen'
import { PlayScreen } from '../../src/ui/screens/PlayScreen'
import { TitleScreen } from '../../src/ui/screens/TitleScreen'
import { memoryStore } from '../../src/ui/storage'
import { S } from '../../src/ui/strings'
import { makeState } from '../engine/fixtures'
import { loadTestChapterStory } from '../engine/testStory'
const html = (el: ReactElement): string => renderToStaticMarkup(el)
const noop = (): void => undefined
let story: Story
beforeAll(async () => {
  story = await loadTestChapterStory()
})
// Every element of a given component type in a (not yet rendered) element tree.
function findAll(node: ReactNode, type: unknown): ReactElement<Record<string, unknown>>[] {
  if (!isValidElement<Record<string, unknown>>(node)) return []
  const kids = Children.toArray(node.props['children'] as ReactNode)
  return [...(node.type === type ? [node] : []), ...kids.flatMap((k) => findAll(k, type))]
}
const liveRegions = (out: string): string[] => [...out.matchAll(/<div[^>]*aria-live="polite"[^>]*>(.*?)<\/div>/gs)].map((m) => m[1] ?? '')
describe('two taps replace a save', () => {
  it('the first tap arms the button and runs nothing; the second runs the action and disarms it', () => {
    expect(tap(false)).toEqual({ armed: true, fire: false })
    expect(tap(true)).toEqual({ armed: false, fire: true })
  })
  it('ConfirmButton shows its label first (the confirm text appears only after the first tap)', () => {
    const out = html(createElement(ConfirmButton, { label: 'New game', confirm: 'Erase save and start over?', className: 'btn', onConfirm: noop }))
    expect(out).toBe('<button type="button" class="btn">New game</button>')
  })
  it('the Ending screen puts New game behind it, with the Title screen button left as a plain button', () => {
    const view: View = { kind: 'end', scene: 'x.end', lines: ['Fin.'], beats: [{ text: 'Fin.', say: undefined }], who: [], place: undefined, mood: undefined, choices: [], ending: 'beacon' }
    const onNew = (): void => undefined
    const tree = EndingScreen({ view, hud: hudOf(makeState()), onNew, onTitle: noop })
    const guarded = findAll(tree, ConfirmButton)
    expect(guarded).toHaveLength(1)
    expect(guarded[0]?.props).toMatchObject({ label: S.newGame, confirm: S.eraseAndStart, onConfirm: onNew })
    const out = html(createElement(EndingScreen, { view, hud: hudOf(makeState()), onNew, onTitle: noop }))
    expect(out).toContain('New game</button>')
    expect(out).not.toContain(S.eraseAndStart)
  })
  it('the error fallback asks too, but Restart chapter and Title screen do not (they keep the save)', () => {
    const h = { canRestartChapter: true, restartChapter: noop, openBackground: noop, toTitle: noop }
    const actions = fallbackActions(h)
    expect(actions.map((a) => [a.label, a.confirm])).toEqual([[S.restartChapter, undefined], [S.newGame, S.eraseAndStart], [S.toTitle, undefined]])
    expect(fallbackActions({ ...h, canRestartChapter: false }).map((a) => a.label)).toEqual([S.newGame, S.toTitle])
    const guarded = findAll(ErrorFallback({ title: 'Oops', lines: ['It broke.'], report: () => '{}', actions }), ConfirmButton)
    expect(guarded).toHaveLength(1)
    expect(guarded[0]?.props).toMatchObject({ label: S.newGame, confirm: S.eraseAndStart })
    const out = html(createElement(ErrorFallback, { title: 'Oops', lines: ['It broke.'], report: () => '{}', actions }))
    for (const label of [S.restartChapter, S.newGame, S.toTitle]) expect(out).toContain(`>${label}</button>`)
    expect(out).not.toContain(S.eraseAndStart)
  })
  it('the Title keeps its rule: a second tap only when a save exists', () => {
    const props = { persistent: true, onNew: noop, onContinue: noop, onSettings: noop }
    const empty = savedGame(memoryStore(), story)
    expect(findAll(TitleScreen({ ...props, saved: empty }), ConfirmButton)).toHaveLength(0)
    const store = memoryStore()
    const game = reduce(makeState(), { type: 'START', bg: 'dockworker', name: 'Ash', seed: 3 }, story)
    writeSave(store, makeSave(game, null, story, 1))
    const withSave = savedGame(store, story)
    expect(withSave.kind).toBe('ok')
    expect(findAll(TitleScreen({ ...props, saved: withSave }), ConfirmButton)).toHaveLength(1)
  })
})
describe('a spoken line is announced once', () => {
  it('a finished spoken turn sits outside the live region; only the turn being typed is inside it', () => {
    const done = [{ who: 'dole', lines: ['"Hey."'] }, { who: undefined, lines: ['He knocks.'] }]
    const out = html(createElement(SceneView, { place: 'hallway', done, now: { who: undefined, lines: ['Silence.'] } }))
    expect(out).toContain('Hey.')
    expect(liveRegions(out)).toEqual(['<p>Silence.</p>'])
  })
  it('the live region stays in the page when nothing is typing (so a later line is announced), and is empty', () => {
    expect(liveRegions(html(createElement(SceneView, { place: undefined, done: [{ who: 'dole', lines: ['"Hey."'] }] })))).toEqual([''])
  })
  it('a turn where a character talks is announced by the Dock only: the middle region is empty, the line is in one region', () => {
    const view: View = { kind: 'next', scene: 'x.a', lines: ['"Stay."'], beats: [{ text: '"Stay."', say: 'dole' }], who: ['dole'], place: 'hallway', mood: undefined, ending: undefined, choices: [] }
    const out = html(createElement(PlayScreen, { view, hud: hudOf(makeState()), step: 0, typewriter: false, toasts: [], toastSeq: 0, saveError: undefined, onChoose: noop, onNext: noop, onMenu: noop, onSettings: noop }))
    const regions = liveRegions(out)
    expect(regions.filter((r) => r.includes('Stay.'))).toHaveLength(1)
    expect(regions[0]).toBe('') // the story in the middle
    expect(out.indexOf('Stay.')).toBeGreaterThan(out.indexOf('class="textbox"'))
  })
})
