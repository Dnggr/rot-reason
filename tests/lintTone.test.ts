// tests/lintTone.test.ts — tone lint: out-of-world words are errors (D23); chapters of 8+ scenes need 85% scenes without a choice (D22)
import { describe, expect, it } from 'vitest'
import type { Scene } from '../src/engine/types'
import { lintStory } from '../scripts/lintCore'
import { paceOf } from '../scripts/lintTone'
import { makeStory, sys } from './engine/storyFixture'
const { scenes: _scenes, ...tables } = makeStory([{ id: 'c1.a', text: 'x', end: 'plain' }])
const lint = (scenes: Scene[]) => lintStory({ ch: scenes }, sys, { ...tables, start: 'c1.s0' }, {})
// n scenes in a chain; the first `game` of them ask for a choice (both options lead on), the rest are narration.
function chain(n: number, game: number): Scene[] {
  return Array.from({ length: n }, (_, i): Scene => {
    const id = `c1.s${i}`
    const to = `c1.s${i + 1}`
    if (i === n - 1) return { id, text: 'end', end: 'plain' }
    if (i < game) return { id, text: 'pick', choices: [{ id: 'a', text: 'Left.', fx: [['honor', 'mercy', true]], to }, { id: 'b', text: 'Right.', to }] }
    return { id, text: 'story', next: to }
  })
}
describe('lintTone: words', () => {
  it('rejects zombie and undead in scene text, glitch text and choices', () => {
    const bad = chain(3, 0)
    bad[0] = { id: 'c1.s0', text: 'A Zombie walks by.', next: 'c1.s1' }
    bad[1] = { id: 'c1.s1', text: ['fine', { if: ['bg', 'x'], text: 'The undead.' }], next: 'c1.s2' }
    const r = lint(bad)
    expect(r.errors.filter((e) => e.includes('D23'))).toHaveLength(2)
  })
  it('allows ordinary words that merely contain them', () => {
    const ok = chain(3, 0)
    ok[0] = { id: 'c1.s0', text: 'The zombified crowd is a phrase nobody uses.', next: 'c1.s1' }
    expect(lint(ok).errors.filter((e) => e.includes('D23'))).toEqual([])
  })
})
describe('lintTone: story share', () => {
  it('counts choice scenes per chapter', () => {
    expect(paceOf(chain(10, 2))).toEqual({ c1: { scenes: 10, game: 2 } })
  })
  it('warns when a chapter of 8+ scenes is under 85% story, stays quiet at the line', () => {
    expect(lint(chain(20, 3)).warnings.filter((w) => w.includes('D22'))).toEqual([])
    expect(lint(chain(10, 2)).warnings.filter((w) => w.includes('D22'))).toHaveLength(1)
  })
  it('exempts chapters shorter than 8 scenes', () => {
    expect(lint(chain(7, 4)).warnings.filter((w) => w.includes('D22'))).toEqual([])
  })
})
