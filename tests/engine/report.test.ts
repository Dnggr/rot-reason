// tests/engine/report.test.ts — debug report: fields, the last 30 log lines in greppable form, and the no-state case
import { describe, expect, it } from 'vitest'
import { REPORT_LOG_LINES, buildReport, reportText } from '../../src/engine/report'
import { makeState } from './fixtures'
const log = Array.from({ length: 45 }, (_, i) => ({ n: i + 1, kind: 'FX' as const, text: `line ${i + 1}` }))
describe('buildReport', () => {
  it('carries version, seed, history, the state and only the last 30 log lines, formatted', () => {
    const state = makeState({ seed: 42, bg: 'mechanic', name: 'Ash', scene: 'c1.a', history: ['c0.start:a'], log })
    const r = buildReport({ version: '0.0.1', state, note: 'stuck here', error: undefined })
    expect(r).toMatchObject({ app: 'rot-reason', version: '0.0.1', note: 'stuck here', error: null, seed: 42, bg: 'mechanic', name: 'Ash', scene: 'c1.a', history: ['c0.start:a'] })
    expect(r.log).toHaveLength(REPORT_LOG_LINES)
    expect(r.log[0]).toBe('[016] FX line 16')
    expect(r.log[29]).toBe('[045] FX line 45')
    expect(r.state).toBe(state)
  })
  it('works without a game (the app broke before one existed) and keeps the error text', () => {
    const r = buildReport({ version: '0.0.1', state: undefined, note: '', error: 'boom' })
    expect(r).toMatchObject({ note: null, error: 'boom', seed: null, bg: null, name: null, scene: null, history: [], log: [], state: null })
  })
  it('reportText is JSON that parses back to the same report', () => {
    const r = buildReport({ version: '0.0.1', state: makeState(), note: undefined, error: undefined })
    expect(JSON.parse(reportText(r))).toEqual(r)
  })
})
