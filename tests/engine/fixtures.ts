// tests/engine/fixtures.ts — makeState(overrides): a valid GameState for engine tests, plus a tiny deed table
import type { DeedTable, GameState, Social } from '../../src/engine/types'
export function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    v: 4, seed: 7, rng: 7, name: 'Ash', scene: 'c0.start', chapter: 'c0', day: 1, phase: 'dawn',
    stats: { hp: 5, reason: 80, rot: 0 }, res: { food: 3, ammo: 2, meds: 1 }, attr: { grit: 2, wits: 3, heart: 1 },
    bg: 'dockworker', traits: [], honor: 0, flags: {}, secrets: [], owed: {}, owedTags: {}, party: [], met: [], deeds: [],
    npc: { nora: { alive: true, trust: 10, fear: 0 }, brick: { alive: true, trust: 0, fear: 5 }, juno: { alive: true, trust: 0, fear: 0 }, hart: { alive: true, trust: 0, fear: 0 } },
    echoes: [], deedCount: {}, history: [], log: [], resume: null,
    ...overrides,
  }
}
export const deeds: DeedTable = { mercy: 5, honest: 2, lie: -3, murder: -20, sacrifice: 12 }
// A tiny approval table for engine tests: Nora likes mercy and dislikes lies, Brick likes intimidation; a companion walks out at trust -30 unless fear is 60+.
export const social: Social = { approval: { nora: { mercy: 10, lie: -5, murder: -10 }, brick: { intimidate: 5 } }, leaveTrust: -30, fearHolds: 60 }
