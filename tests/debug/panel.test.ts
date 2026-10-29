// tests/debug/panel.test.ts — the console handle, and the panel's read-only and control views render what a bug hunter needs
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { Controls } from '../../src/debug/Controls'
import { DebugPanel } from '../../src/debug/DebugPanel'
import { installHandle, type RrHandle } from '../../src/debug/rrHandle'
import { StateView } from '../../src/debug/StateView'
import { reduce } from '../../src/engine/reducer'
import type { GameState, Story } from '../../src/engine/types'
import type { DebugApi } from '../../src/ui/debugApi'
import { loadTestChapterStory } from '../engine/testStory'
let story: Story
beforeAll(async () => {
  story = await loadTestChapterStory()
})
const html = (el: ReactElement): string => renderToStaticMarkup(el)
const game = (): GameState => reduce({} as GameState, { type: 'START', bg: 'dockworker', name: 'Ash', seed: 7 }, story)
const api = (over: Partial<DebugApi> = {}): DebugApi => ({ game: game(), story, playing: true, dispatch: () => undefined, report: (n) => n, ...over })
describe('installHandle', () => {
  it('exposes the live state, dispatch and story, and removes itself on cleanup', () => {
    const target: { __rr?: RrHandle } = {}
    let current = game()
    const dispatched: unknown[] = []
    const off = installHandle(target, () => current, (a) => dispatched.push(a), story)
    expect(target.__rr?.state.scene).toBe('t.wake')
    current = { ...current, scene: 't.echo' }
    expect(target.__rr?.state.scene).toBe('t.echo') // read live, not a copy
    target.__rr?.dispatch({ type: 'CONTINUE' })
    expect(dispatched).toEqual([{ type: 'CONTINUE' }])
    expect(target.__rr?.story).toBe(story)
    off()
    expect(target.__rr).toBeUndefined()
  })
})
describe('DebugPanel', () => {
  it('starts closed: only the Debug toggle is shown', () => {
    const out = html(createElement(DebugPanel, api()))
    expect(out).toContain('>Debug</button>')
    expect(out).toContain('aria-expanded="false"')
    expect(out).not.toContain('dbg-body')
  })
})
describe('StateView', () => {
  it('shows scene, seed, flags, party, echoes, the state tree and the log lines', () => {
    const g = { ...game(), flags: { b_flag: true as const, a_flag: true as const }, party: ['nora'], echoes: [{ scene: 't.echo', dueIn: 3 }] }
    const out = html(createElement(StateView, { game: g }))
    expect(out).toContain('t.wake · chapter t · day 1 dawn')
    expect(out).toContain('seed 7')
    expect(out).toContain('flags: a_flag, b_flag')
    expect(out).toContain('party: nora')
    expect(out).toContain('t.echo in 3')
    expect(out).toContain('State tree')
    expect(out).toContain('SCENE t.wake')
    expect(out).not.toContain('"history"') // the tree leaves out the log and history, which have their own lines
  })
  it('says none for empty lists and (empty) for an empty log', () => {
    const out = html(createElement(StateView, { game: { ...game(), flags: {}, log: [] } }))
    expect(out).toContain('flags: none')
    expect(out).toContain('echoes: none')
    expect(out).toContain('(empty)')
  })
  it('keeps only the last 30 log lines', () => {
    const log = Array.from({ length: 45 }, (_, i) => ({ n: i + 1, kind: 'FX' as const, text: `line${i + 1}` }))
    const out = html(createElement(StateView, { game: { ...game(), log } }))
    expect(out).toContain('line45')
    expect(out).toContain('line16')
    expect(out).not.toContain('line15<')
  })
})
describe('Controls', () => {
  it('offers jump, set, flags, day and rewind; every scene id is a jump suggestion', () => {
    const out = html(createElement(Controls, { api: api() }))
    for (const w of ['Jump', 'Set', 'Day +1', 'Set flag', 'Clear', 'Rewind last step']) expect(out).toContain(w)
    expect(out).toContain('<option value="t.wake">')
    expect(out).toContain('<option value="p.dream">')
  })
  it('disables everything and says why when no game is running; rewind needs a history', () => {
    const off = html(createElement(Controls, { api: api({ playing: false }) }))
    expect(off).toContain('Start a game to use the controls')
    expect(off.match(/disabled=""/g)?.length).toBeGreaterThanOrEqual(6)
    expect(html(createElement(Controls, { api: api() }))).toMatch(/disabled=""[^>]*>Rewind last step/)
  })
  it('on a scene with a check it offers Force pass / fail with the d6 face it will use', () => {
    const out = html(createElement(Controls, { api: api({ game: { ...game(), scene: 'p.stairs' } }) }))
    expect(out).toMatch(/Force pass: pick [a-d] \(d6 [1-6]\)/)
    expect(out).toMatch(/Force fail: pick [a-d] \(d6 [1-6]\)/)
  })
})