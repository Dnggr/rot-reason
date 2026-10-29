// tests/engine/log.test.ts — log lines: numbering, ring buffer, greppable format
import { describe, expect, it } from 'vitest'
import { formatEntry, line, LOG_MAX, pushLog, signed } from '../../src/engine/log'
import { makeState } from './fixtures'
describe('log', () => {
  it('numbers new entries after the last one and leaves the input untouched', () => {
    const s = makeState({ log: [{ n: 4, kind: 'SCENE', text: 'c0.start' }] })
    const next = pushLog(s, [line('FX', 'set a'), line('FX', 'set b')])
    expect(next.log.map((e) => e.n)).toEqual([4, 5, 6])
    expect(s.log).toHaveLength(1)
  })
  it('starts at 1 and returns the same state for no lines', () => {
    const s = makeState()
    expect(pushLog(s, [line('SCENE', 'x')]).log[0]?.n).toBe(1)
    expect(pushLog(s, [])).toBe(s)
  })
  it('keeps only the last 200 entries, numbers keep counting', () => {
    let s = makeState()
    for (let i = 0; i < LOG_MAX + 15; i++) s = pushLog(s, [line('FX', `e${i}`)])
    expect(s.log).toHaveLength(LOG_MAX)
    expect(s.log[0]?.n).toBe(16)
    expect(s.log[LOG_MAX - 1]?.n).toBe(LOG_MAX + 15)
  })
  it('formats greppable lines and signed numbers', () => {
    expect(formatEntry({ n: 12, kind: 'HONOR', text: '+5 mercy witnessed -> 12' })).toBe('[012] HONOR +5 mercy witnessed -> 12')
    expect([signed(3), signed(0), signed(-2)]).toEqual(['+3', '0', '-2'])
  })
})