// ui/fallback.ts — the recovery actions the error fallback offers (ARCHITECTURE §5.4, D31): Restart chapter when a checkpoint exists, New game (a second tap confirms: it replaces the save), Title screen. Pure.
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
