// tests/ui/confirm.test.ts — the two-tap rule: a blur or a wait disarms the button (was: it stayed armed until the screen changed, M3 s4 bug, D33)
import { describe, expect, it } from 'vitest'
import { ARM_MS, step, tap } from '../../src/ui/confirm'
describe('confirm step', () => {
  it('the first tap arms, the second fires and disarms', () => {
    expect(step(false, 'tap')).toEqual({ armed: true, fire: false })
    expect(step(true, 'tap')).toEqual({ armed: false, fire: true })
    expect(tap(false)).toEqual(step(false, 'tap'))
  })
  it('a blur or the timeout disarms and never fires, armed or not', () => {
    for (const event of ['blur', 'timeout'] as const) for (const armed of [true, false]) expect(step(armed, event)).toEqual({ armed: false, fire: false })
  })
  it('a stray tap after a disarm only arms again, so it cannot erase the save', () => {
    const waited = step(true, 'timeout')
    expect(step(waited.armed, 'tap').fire).toBe(false)
  })
  it('the wait is a few seconds: long enough to read the question, short enough to be forgotten', () => {
    expect(ARM_MS).toBeGreaterThanOrEqual(2000)
    expect(ARM_MS).toBeLessThanOrEqual(8000)
  })
})
