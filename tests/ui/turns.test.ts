// tests/ui/turns.test.ts — turnsOf: beats become turns, one per speaker change (UI_UX §3)
import { describe, expect, it } from 'vitest'
import type { BeatView } from '../../src/engine/select'
import { turnsOf } from '../../src/ui/turns'
const n = (text: string): BeatView => ({ text, say: undefined })
const s = (who: string, text: string): BeatView => ({ text, say: who })
describe('turnsOf', () => {
  it('keeps all-narration text in one turn', () => {
    expect(turnsOf([n('a'), n('b')])).toEqual([{ who: undefined, lines: ['a', 'b'] }])
  })
  it('starts a new turn at each speaker change and merges neighbours with the same speaker', () => {
    const t = turnsOf([n('a'), s('dole', '1'), s('dole', '2'), n('b'), s('juno', '3'), s('dole', '4')])
    expect(t.map((x) => [x.who, x.lines])).toEqual([[undefined, ['a']], ['dole', ['1', '2']], [undefined, ['b']], ['juno', ['3']], ['dole', ['4']]])
  })
  it('gives nothing for no beats', () => {
    expect(turnsOf([])).toEqual([])
  })
})