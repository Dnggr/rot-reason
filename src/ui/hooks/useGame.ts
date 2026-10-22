// ui/hooks/useGame.ts — the one hook the UI uses: engine state in a reducer, screens, autosave, Continue, restart chapter, debug report (ARCHITECTURE §1)
import { useEffect, useMemo, useReducer, useState } from 'react'
import { buildReport, reportText } from '../../engine/report'
import { makeSave } from '../../engine/save'
import { currentView, hudOf, type Hud, type View } from '../../engine/select'
import type { ChoiceId, GameState, Story } from '../../engine/types'
import { S } from '../strings'
import type { Store } from '../storage'
import { APP_VERSION } from '../version'
import { autosave, backgroundCards, initialUi, newSeed, savedGame, uiReducer, type BackgroundCard, type Saved, type Screen } from './gameModel'
export interface GameApi {
  screen: Screen
  game: GameState // read-only; for the error boundary's report, never rendered from
  view: View
  hud: Hud
  toasts: readonly string[]
  toastSeq: number
  cards: readonly BackgroundCard[]
  saved: Saved // what Continue would load (only read on the title screen)
  persistent: boolean
  saveError: string | undefined
  canRestartChapter: boolean
  openBackground(): void
  toTitle(): void
  start(bg: string, name: string): void
  resume(): void
  choose(id: ChoiceId): void
  next(): void
  restartChapter(): void
  report(): string
}
export function useGame(story: Story, persist: Store): GameApi {
  const reducer = useMemo(() => uiReducer(story), [story])
  const [ui, dispatch] = useReducer(reducer, story, initialUi)
  const [saveError, setSaveError] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (ui.screen === 'play') setSaveError(autosave(persist.store, ui.game, ui.checkpoint, story, Date.now()))
  }, [ui.game, ui.checkpoint, ui.screen, persist, story])
  const saved = useMemo<Saved>(() => (ui.screen === 'title' ? savedGame(persist.store, story) : { kind: 'none' }), [ui.screen, persist, story])
  const cards = useMemo(() => backgroundCards(story), [story])
  const view = useMemo(() => currentView(ui.game, story), [ui.game, story])
  const { checkpoint, game } = ui
  return {
    screen: ui.screen, game, view, hud: hudOf(game), toasts: ui.toasts, toastSeq: ui.seq, cards, saved, persistent: persist.persistent, saveError,
    canRestartChapter: checkpoint !== null,
    openBackground: () => dispatch({ type: 'SCREEN', screen: 'background' }),
    toTitle: () => dispatch({ type: 'SCREEN', screen: 'title' }),
    start: (bg, name) => dispatch({ type: 'START', bg, name: name.trim() || S.defaultName, seed: newSeed() }),
    resume: () => {
      if (saved.kind === 'ok') dispatch({ type: 'LOAD', save: saved.save })
    },
    choose: (id) => dispatch({ type: 'CHOOSE', choice: id }),
    next: () => dispatch({ type: 'CONTINUE' }),
    restartChapter: () => {
      if (checkpoint !== null) dispatch({ type: 'LOAD', save: makeSave(checkpoint, checkpoint, story, 0) })
    },
    report: () => reportText(buildReport({ version: APP_VERSION, state: game, note: undefined, error: undefined })),
  }
}
