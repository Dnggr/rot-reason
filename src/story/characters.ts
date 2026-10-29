// story/characters.ts — the cast with starting trust / fear (CHARACTERS.md T/F lines); every id here is a valid npc id in effects and conditions
import type { NpcStart } from '../engine/types'
export const NPCS: Readonly<Record<string, NpcStart>> = {
  nora: { name: 'Nora Vance', trust: 10, fear: 0 },
  brick: { name: 'Dominic "Brick" Salazar', trust: 0, fear: 5 },
  juno: { name: 'Juno Park', trust: 5, fear: 0 },
  hart: { name: 'Pastor Elias Hart', trust: 0, fear: 0 },
  calloway: { name: 'Sgt. Ray Calloway', trust: -5, fear: 5 },
  vera: { name: 'Warden Vera Kline', trust: 0, fear: 10 },
  silas: { name: 'Silas Crane', trust: 0, fear: 0 },
  biscuit: { name: 'Biscuit', trust: 0, fear: 0 },
  dole: { name: 'Walt Dole', trust: 0, fear: 0 }, // Prologue neighbor in 3B, Biscuit's owner; not a companion
}