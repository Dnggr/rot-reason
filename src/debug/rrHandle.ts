// debug/rrHandle.ts — the console handle `window.__rr = { state, dispatch, story }` (ARCHITECTURE §7); `state` is read live. Installed while the panel is mounted.
import type { UiAction } from '../ui/hooks/gameModel'
import type { GameState, Story } from '../engine/types'
export interface RrHandle {
  readonly state: GameState
  dispatch: (a: UiAction) => void
  readonly story: Story
}
declare global {
  interface Window {
    __rr?: RrHandle
  }
}
// `target` is `window` in the browser; tests pass a plain object. Returns the cleanup.
export function installHandle(target: { __rr?: RrHandle }, state: () => GameState, dispatch: (a: UiAction) => void, story: Story): () => void {
  target.__rr = { get state() { return state() }, dispatch, story }
  return () => {
    delete target.__rr
  }
}
