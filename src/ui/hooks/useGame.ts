// ui/hooks/useGame.ts — the one hook the UI uses: engine state in a reducer, screens, autosave, Continue, restart chapter, debug report (ARCHITECTURE §1)
import { useEffect, useMemo, useReducer, useState } from 'react'
import { buildReport, reportText } from '../../engine/report'
import { makeSave } from '../../engine/save'
import { journalOf, type JournalView } from '../../engine/journal'
import { currentView, hudOf, type Hud, type View } from '../../engine/select'
import type { ChoiceId, GameState, Story } from '../../engine/types'
import { S } from '../strings'
import type { Store } from '../storage'
import type { Banner } from '../tiers'
import type { ReadChunk } from '../turns'
import { APP_VERSION } from '../version'
import { autosave, backgroundCards, eraseSave, hasSave, initialUi, newSeed, savedGame, uiReducer, type BackgroundCard, type Saved, type Screen, type UiAction } from './gameModel'
export interface GameApi {
  screen: Screen
  from: Screen // where Settings or the Journal return to
  step: number // scenes played so far; the key that restarts the typewriter and the choice animation
  game: GameState // read-only; for the error boundary's report, never rendered from
  view: View
  hud: Hud
  toasts: readonly string[]
  toastSeq: number
  read: readonly ReadChunk[] // scenes already read, shown above the current one
  journal: JournalView // what the Journal shows now (drawn only on the 'journal' screen)
  banner: Banner | undefined // a tier change to show once
  cards: readonly BackgroundCard[]
  saved: Saved // what Continue would load (only read on the title screen)
  saveExists: boolean // for Settings > Reset saved game
  persistent: boolean
  saveError: string | undefined
  canRestartChapter: boolean
  openBackground(): void
  openSettings(): void
  openJournal(): void
  closeJournal(): void
  dismissBanner(): void
  back(): void // leave Settings
  resetSave(): void
  toTitle(): void
  start(bg: string, name: string): void
  resume(): void
  choose(id: ChoiceId): void
  next(): void
  restartChapter(): void
  report(note?: string): string
  dispatch(a: UiAction): void // for the debug panel only
}
export function useGame(story: Story, persist: Store, debug: boolean = false): GameApi {
  const reducer = useMemo(() => uiReducer(story, debug), [story, debug])
  const [ui, dispatch] = useReducer(reducer, story, initialUi)
  const [saveError, setSaveError] = useState<string | undefined>(undefined)
  const [, rerender] = useState(0) // Reset saved game changes storage, not state: this re-render makes `saveExists` read it again
  useEffect(() => {
    if (ui.screen === 'play') setSaveError(autosave(persist.store, ui.game, ui.checkpoint, story, Date.now()))
  }, [ui.game, ui.checkpoint, ui.screen, persist, story])
  const saved = useMemo<Saved>(() => (ui.screen === 'title' ? savedGame(persist.store, story) : { kind: 'none' }), [ui.screen, persist, story])
  const saveExists = ui.screen === 'settings' && hasSave(persist.store)
  const cards = useMemo(() => backgroundCards(story), [story])
  const view = useMemo(() => currentView(ui.game, story), [ui.game, story])
  const { checkpoint, game } = ui
  const journal = useMemo(() => journalOf(game, story), [game, story])
  return {
    screen: ui.screen, from: ui.from, step: game.history.length, game, view, hud: hudOf(game), toasts: ui.toasts, toastSeq: ui.seq, read: ui.read, journal, banner: ui.banner, cards, saved, saveExists, persistent: persist.persistent, saveError,
    canRestartChapter: checkpoint !== null,
    openBackground: () => dispatch({ type: 'SCREEN', screen: 'background' }),
    openSettings: () => dispatch({ type: 'SCREEN', screen: 'settings' }),
    openJournal: () => dispatch({ type: 'SCREEN', screen: 'journal' }),
    closeJournal: () => dispatch({ type: 'SCREEN', screen: 'play' }),
    dismissBanner: () => dispatch({ type: 'BANNER_OFF' }),
    back: () => dispatch({ type: 'SCREEN', screen: ui.from }),
    resetSave: () => {
      eraseSave(persist.store)
      rerender((n) => n + 1)
    },
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
    report: (note) => reportText(buildReport({ version: APP_VERSION, state: game, note, error: undefined })),
    dispatch,
  }
}
