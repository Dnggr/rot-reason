// tests/engine/fixtures.ts — makeState(overrides): a valid GameState for engine tests, plus a tiny deed table
import type { DeedTable, GameState } from '../../src/engine/types'
export function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    v: 1, seed: 7, rng: 7, name: 'Ash', scene: 'c0.start', chapter: 'c0', day: 1, phase: 'dawn',
    stats: { hp: 5, reason: 80, rot: 0 }, res: { food: 3, ammo: 2, meds: 1 }, attr: { grit: 2, wits: 3, heart: 1 },
    bg: 'dockworker', traits: [], honor: 0, flags: {}, secrets: [], owed: {}, party: [],
    npc: { nora: { alive: true, trust: 10, fear: 0 }, brick: { alive: true, trust: 0, fear: 5 }, juno: { alive: true, trust: 0, fear: 0 }, hart: { alive: true, trust: 0, fear: 0 } },
    echoes: [], deedCount: {}, history: [], log: [],
    ...overrides,
  }
}
export const deeds: DeedTable = { mercy: 5, honest: 2, lie: -3, murder: -20, sacrifice: 12 }
