// ui/hooks/gameModel.ts — pure UI state around the engine: screen, game, checkpoint, toasts; the reducer, autosave and Continue helpers (D21)
import { SYS_ENDING } from '../../engine/endings'
import { SYS_ERROR } from '../../engine/ids'
import { startGame } from '../../engine/init'
import { pushLog } from '../../engine/log'
import { reduce } from '../../engine/reducer'
import { makeSave, readSave, writeSave, type KeyValueStore } from '../../engine/save'
import { hudOf, type Hud, type View } from '../../engine/select'
import type { Action, Background, GameState, SaveData, Story } from '../../engine/types'
import { diffToasts } from '../toasts'
export type Screen = 'title' | 'background' | 'play'
export interface UiState {
  screen: Screen
  game: GameState // before the first START this is a placeholder that is never shown (screen is 'title')
  checkpoint: GameState | null // last chapter gate, for "Restart chapter"
  toasts: readonly string[]
  seq: number // bumps on every action so the Toast can restart its timer
}
export type UiAction = Action | { type: 'SCREEN'; screen: Screen }
export function initialUi(story: Story): UiState {
  const r = startGame(story, Object.keys(story.backgrounds)[0] ?? '', '', 1) // throws on a story with no background: the error boundary shows it
  return { screen: 'title', game: pushLog(r.state, r.log), checkpoint: null, toasts: [], seq: 0 }
}
// Wraps engine `reduce` (the only state-changing path); everything else here is navigation and display.
export function uiReducer(story: Story): (ui: UiState, a: UiAction) => UiState {
  return (ui, a) => {
    const seq = ui.seq + 1
    if (a.type === 'SCREEN') return { ...ui, screen: a.screen, toasts: [], seq }
    const game = reduce(ui.game, a, story)
    if (a.type === 'LOAD' && game.log[game.log.length - 1]?.kind === 'ERROR') return { ...ui, game, toasts: [], seq } // the engine rejected the snapshot
    const base = a.type === 'START' ? null : a.type === 'LOAD' ? a.save.checkpoint : ui.checkpoint
    const checkpoint = game.scene === SYS_ERROR ? base : makeSave(game, base, story, 0).checkpoint // the engine moves it at `gate` scenes
    const played = a.type === 'CHOOSE' || a.type === 'CONTINUE'
    const screen = a.type === 'START' || a.type === 'LOAD' ? 'play' : ui.screen
    return { screen, game, checkpoint, toasts: played ? diffToasts(ui.game, game) : [], seq }
  }
}
export type BackgroundCard = Background & { key: string }
export const backgroundCards = (story: Story): BackgroundCard[] => Object.entries(story.backgrounds).map(([key, bg]) => ({ key, ...bg }))
// Autosave after every state change (D21). Never saves a state parked on sys.error. Returns the error text when the write failed.
export function autosave(store: KeyValueStore, game: GameState, checkpoint: GameState | null, story: Story, now: number): string | undefined {
  if (game.scene === SYS_ERROR) return undefined
  try {
    writeSave(store, makeSave(game, checkpoint, story, now))
    return undefined
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
}
export type Saved =
  | { kind: 'none' }
  | { kind: 'ok'; save: SaveData; via: 'snapshot' | 'replay' | 'checkpoint'; hud: Hud; chapter: string }
  | { kind: 'broken'; errors: string[] }
export function savedGame(store: KeyValueStore, story: Story): Saved {
  const r = readSave(store, story)
  if (r === undefined) return { kind: 'none' }
  if (!r.ok) return { kind: 'broken', errors: r.errors }
  return { kind: 'ok', save: r.save, via: r.via, hud: hudOf(r.save.snapshot), chapter: r.save.snapshot.chapter }
}
export const newSeed = (): number => crypto.getRandomValues(new Uint32Array(1))[0] ?? 1
// What the play screen shows for a view: the error fallback (missing scene or a system fallback scene), the ending, or the scene itself. Never blank.
export function playRoute(v: View): 'fallback' | 'ending' | 'play' {
  if (v.kind === 'error' || (v.kind === 'end' && v.ending === SYS_ENDING)) return 'fallback'
  return v.kind === 'end' ? 'ending' : 'play'
}
