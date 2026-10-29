// tests/ui/healedUi.test.ts — M3 s8 review bugs closed in M3 s9: a healed save says so on Continue; `--blood-text` is readable (4.5:1) on the default palette
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { reduce } from '../../src/engine/reducer'
import { SAVE_KEY, makeSave } from '../../src/engine/save'
import type { Story } from '../../src/engine/types'
import { savedGame } from '../../src/ui/hooks/gameModel'
import { TitleScreen } from '../../src/ui/screens/TitleScreen'
import { memoryStore } from '../../src/ui/storage'
import { S } from '../../src/ui/strings'
import { makeState } from '../engine/fixtures'
import { loadTestChapterStory } from '../engine/testStory'
let story: Story
beforeAll(async () => {
  story = await loadTestChapterStory()
})
const props = { persistent: true, onNew: (): void => undefined, onContinue: (): void => undefined, onSettings: (): void => undefined }
const title = (saved: ReturnType<typeof savedGame>): string => renderToStaticMarkup(createElement(TitleScreen, { ...props, saved }))
describe('a healed save is not silent', () => {
  const game = () => reduce(makeState(), { type: 'START', bg: 'dockworker', name: 'Ash', seed: 3 }, story)
  it('savedGame carries `healed`, and Continue shows the line', () => {
    const id = Object.keys(story.npcs)[0] as string
    const raw = JSON.parse(JSON.stringify(makeSave(game(), null, story, 1))) as { snapshot: { npc: Record<string, unknown> } }
    delete raw.snapshot.npc[id] // an npc the story added after this save was written
    const store = memoryStore()
    store.setItem(SAVE_KEY, JSON.stringify(raw))
    const saved = savedGame(store, story)
    expect(saved).toMatchObject({ kind: 'ok', via: 'snapshot', healed: [`npc added from the story: ${id}`] })
    expect(title(saved)).toContain(S.healed)
  })
  it('a fine save has no `healed` and no line', () => {
    const store = memoryStore()
    store.setItem(SAVE_KEY, JSON.stringify(makeSave(game(), null, story, 1)))
    const saved = savedGame(store, story)
    expect(saved.kind === 'ok' && 'healed' in saved).toBe(false)
    expect(title(saved)).not.toContain(S.healed)
  })
})
describe('--blood-text contrast (the fill red --blood stays for fills and borders)', () => {
  const css = readFileSync('src/ui/styles/tokens.css', 'utf8')
  const token = (block: string, name: string): string => {
    const hex = new RegExp(`${name}:\\s*#([0-9a-fA-F]{3,6})\\b`).exec(block)?.[1] ?? ''
    return `#${hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex}` // #000 -> #000000
  }
  const lum = (hex: string): number => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const ratio = (a: string, b: string): number => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
  const root = css.slice(0, css.indexOf(':root[data-text'))
  const hc = css.slice(css.indexOf(':root.hc'))
  it('default palette: above 4.5:1 on --bg and on --panel', () => {
    expect(ratio(token(root, '--blood-text'), token(root, '--bg'))).toBeGreaterThanOrEqual(4.5)
    expect(ratio(token(root, '--blood-text'), token(root, '--panel'))).toBeGreaterThanOrEqual(4.5)
  })
  it('high contrast: above 7:1 on black, as UI_UX promises', () => {
    expect(ratio(token(hc, '--blood-text'), token(hc, '--bg'))).toBeGreaterThanOrEqual(7)
  })
})
