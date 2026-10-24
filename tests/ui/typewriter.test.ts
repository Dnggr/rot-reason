// tests/ui/typewriter.test.ts — the typewriter's pure parts: character count, the time step, and the shown / hidden split
import { describe, expect, it } from 'vitest'
import { MS_PER_CHAR, splitLines, tick, totalChars } from '../../src/ui/typewriter'
describe('totalChars', () => {
  it('counts characters across lines, an emoji as one', () => {
    expect(totalChars([])).toBe(0)
    expect(totalChars(['abc', '', 'de'])).toBe(5)
    expect(totalChars(['a🙂b'])).toBe(3)
  })
})
describe('tick', () => {
  it('shows one character per MS_PER_CHAR and carries the remainder', () => {
    expect(MS_PER_CHAR).toBe(30)
    const a = tick({ count: 0, carry: 0 }, 70, 100)
    expect(a).toEqual({ count: 2, carry: 10 })
    expect(tick(a, 20, 100)).toEqual({ count: 3, carry: 0 })
  })
  it('does nothing for a zero or short step, and stops at the total with no carry', () => {
    expect(tick({ count: 4, carry: 0 }, 0, 10)).toEqual({ count: 4, carry: 0 })
    expect(tick({ count: 4, carry: 0 }, 29, 10)).toEqual({ count: 4, carry: 29 })
    expect(tick({ count: 9, carry: 5 }, 10_000, 10)).toEqual({ count: 10, carry: 0 })
    expect(tick({ count: 0, carry: 0 }, 5, 0)).toEqual({ count: 0, carry: 0 })
  })
  it('takes the speed as a parameter', () => {
    expect(tick({ count: 0, carry: 0 }, 100, 50, 10)).toEqual({ count: 10, carry: 0 })
  })
})
describe('splitLines', () => {
  it('splits at the count, line by line, and the two halves always rebuild the text', () => {
    const lines = ['Hello', 'World!']
    expect(splitLines(lines, 0)).toEqual([{ shown: '', rest: 'Hello' }, { shown: '', rest: 'World!' }])
    expect(splitLines(lines, 3)).toEqual([{ shown: 'Hel', rest: 'lo' }, { shown: '', rest: 'World!' }])
    expect(splitLines(lines, 8)).toEqual([{ shown: 'Hello', rest: '' }, { shown: 'Wor', rest: 'ld!' }])
    for (const n of [0, 1, 5, 6, 11, 99]) expect(splitLines(lines, n).map((p) => p.shown + p.rest)).toEqual(lines)
  })
  it('shows everything for a count past the end and nothing for a negative one; never cuts an emoji', () => {
    expect(splitLines(['ab'], 50)).toEqual([{ shown: 'ab', rest: '' }])
    expect(splitLines(['ab'], -3)).toEqual([{ shown: '', rest: 'ab' }])
    expect(splitLines(['a🙂b'], 2)).toEqual([{ shown: 'a🙂', rest: 'b' }])
  })
})
