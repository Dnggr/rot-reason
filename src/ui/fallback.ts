// ui/fallback.ts — the ways back into a run: the error fallback's actions (ARCHITECTURE §5.4, D31: Restart chapter when a checkpoint exists, New game with a second tap, Title screen) and whether the death ending offers a retry from the checkpoint (D32). Pure.
import { DEATH_ENDING } from '../engine/endings'
import type { FallbackAction } from './components/ErrorFallback'
import { S } from './strings'
export interface FallbackHandlers {
  canRestartChapter: boolean
  restartChapter(): void
  openBackground(): void
  toTitle(): void
}
export function fallbackActions(h: FallbackHandlers): FallbackAction[] {
  const actions: FallbackAction[] = [{ label: S.newGame, confirm: S.eraseAndStart, onClick: h.openBackground }, { label: S.toTitle, onClick: h.toTitle }]
  return h.canRestartChapter ? [{ label: S.restartChapter, onClick: h.restartChapter }, ...actions] : actions
}
// Dying is not the end of the story: the death ending (and Continue on a dead save) offers Restart chapter while a checkpoint exists. The other endings are final.
export const canRetry = (ending: string | undefined, canRestartChapter: boolean): boolean => ending === DEATH_ENDING && canRestartChapter