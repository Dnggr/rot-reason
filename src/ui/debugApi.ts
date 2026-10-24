// ui/debugApi.ts — the contract between the game and the debug panel. ui never imports src/debug: main.tsx loads the panel and hands it to <App /> as a component (ARCHITECTURE §1).
import type { ReactElement } from 'react'
import type { GameState, Story } from '../engine/types'
import type { UiAction } from './hooks/gameModel'
export interface DebugApi {
  game: GameState
  story: Story
  playing: boolean // false on the title, background and settings screens: the controls are off
  dispatch: (a: UiAction) => void
  report: (note: string) => string // the debug report JSON with the player's note
}
export type DebugPanelComponent = (api: DebugApi) => ReactElement | null
