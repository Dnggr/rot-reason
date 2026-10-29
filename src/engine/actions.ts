// engine/actions.ts — the save envelope, the debug patch and the Action union (split from types.ts to keep it under 200 lines; types.ts re-exports them)
import type { ChoiceId, GameState, ResKey, SceneId, StatKey } from './types'
export interface SaveData {
  v: number
  seed: number
  bg: string // seed + bg + name + history is enough to replay the game when the snapshot is unusable
  name: string
  history: string[]
  snapshot: GameState
  checkpoint: GameState | null
  savedAt: number // epoch ms, supplied by the storage layer (the engine has no clock)
}
// A DEBUG_SET payload (engine/debug.ts): set one value to an exact number, or switch one flag. Debug build only.
export type DebugPatch =
  | { kind: 'stat'; key: StatKey; value: number }
  | { kind: 'res'; key: ResKey; value: number }
  | { kind: 'honor'; value: number }
  | { kind: 'day'; value: number }
  | { kind: 'rng'; value: number } // reseeds the roll stream (state.rng); state.seed, the start seed, is left alone
  | { kind: 'flag'; key: string; on: boolean }
export type Action =
  | { type: 'START'; bg: string; name: string; seed: number }
  | { type: 'CHOOSE'; choice: ChoiceId }
  | { type: 'CONTINUE' }
  | { type: 'CAMP'; action: string }
  | { type: 'LOAD'; save: SaveData }
  | { type: 'DEBUG_JUMP'; scene: SceneId } // debug build only (the UI drops these otherwise): enter any scene
  | { type: 'DEBUG_SET'; patch: DebugPatch }
  | { type: 'DEBUG_ROLL'; roll: number } // the next d6 lands on `roll` (1-6)