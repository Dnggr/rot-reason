// tests/ui/toasts.test.ts — toast lines from a state diff: order, signs, who will remember, cap, nothing changed
import { describe, expect, it } from 'vitest'
import { MAX_TOASTS, diffToasts } from '../../src/ui/toasts'
import { makeState } from '../engine/fixtures'
const prev = makeState()
describe('diffToasts', () => {
  it('lists honor, vitals, then resources, with signs', () => {
    const next = makeState({ honor: 5, stats: { hp: 4, reason: 85, rot: 0 }, res: { food: 2, ammo: 2, meds: 3 } })
    expect(diffToasts(prev, next)).toEqual(['Honor +5', '-1 HP', '+5 Reason', '-1 Food', '+2 Meds'])
  })
  it('says who will remember when trust or fear moved, once per person', () => {
    const next = makeState({ npc: { ...prev.npc, nora: { alive: true, trust: 20, fear: 3 }, brick: { alive: true, trust: 0, fear: 20 } } })
    expect(diffToasts(prev, next)).toEqual(['Nora will remember that', 'Brick will remember that'])
  })
  it('is empty when nothing changed (a stale click)', () => {
    expect(diffToasts(prev, makeState())).toEqual([])
  })
  it('caps the list', () => {
    const next = makeState({ honor: 9, stats: { hp: 1, reason: 1, rot: 9 }, res: { food: 0, ammo: 0, meds: 0 }, npc: { ...prev.npc, nora: { alive: true, trust: 99, fear: 0 } } })
    expect(diffToasts(prev, next)).toHaveLength(MAX_TOASTS)
  })
})
