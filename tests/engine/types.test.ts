// tests/engine/types.test.ts — type fixtures (checked by `npm run typecheck`): state and actions stay JSON-serializable
import { describe, expect, it } from 'vitest'
import type { Action, GameState, SaveData } from '../../src/engine/types'
const state: GameState = {
  v: 1, seed: 7, rng: 7, name: 'Ash', scene: 'c0.start', chapter: 'c0', day: 1, phase: 'dawn',
  stats: { hp: 5, reason: 80, rot: 0 }, res: { food: 3, ammo: 2, meds: 1 }, attr: { grit: 2, wits: 3, heart: 1 },
  bg: 'dockworker', traits: ['Medic'], honor: 0, flags: { route_church: true }, secrets: ['hart_wife'], owed: { hart_wife: 3 }, owedTags: { hart_wife: ['mercy'] }, deeds: [],
  party: ['nora'], met: ['nora'], npc: { nora: { alive: true, trust: 10, fear: 0 } },
  echoes: [{ scene: 'c4.father', dueIn: 12 }, { scene: 'c4.hart_knows', atChapter: 'c4' }],
  deedCount: { mercy: 1 }, history: ['c0.start:a'], log: [{ n: 1, kind: 'SCENE', text: 'c0.start' }], resume: 'c2.toll',
}
const save: SaveData = { v: 1, seed: 7, bg: 'dockworker', name: 'Ash', history: ['c0.start:a'], snapshot: state, checkpoint: null, savedAt: 0 }
const actions: Action[] = [
  { type: 'START', bg: 'dockworker', name: 'Ash', seed: 7 },
  { type: 'CHOOSE', choice: 'a' },
  { type: 'CONTINUE' },
  { type: 'CAMP', action: 'rest' },
  { type: 'LOAD', save },
]
describe('engine types', () => {
  it('GameState survives a JSON round trip unchanged', () => {
    expect(JSON.parse(JSON.stringify(state))).toEqual(state)
  })
  it('SaveData and every Action survive a JSON round trip unchanged', () => {
    expect(JSON.parse(JSON.stringify(save))).toEqual(save)
    expect(JSON.parse(JSON.stringify(actions))).toEqual(actions)
  })
})
