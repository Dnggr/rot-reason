// engine/echoes.ts — delayed consequences: schedule, tick, due, take (ARCHITECTURE §4; reducer order: tick -> fx -> take)
import { line, type Applied, type LogLine } from './log'
import type { EchoEntry, EchoSpec, GameState, SceneId } from './types'
// `after: N` = N scenes play normally, then the echo fires at the next transition. `at: 'c4'` = due while state.chapter is 'c4'.
export function schedule(state: GameState, spec: EchoSpec): Applied {
  const { scene, after, at } = spec
  if (after !== undefined && at === undefined) {
    return { state: { ...state, echoes: [...state.echoes, { scene, dueIn: after }] }, log: [line('ECHO', `${scene} in ${after}`)] }
  }
  if (at !== undefined && after === undefined) {
    return { state: { ...state, echoes: [...state.echoes, { scene, atChapter: at }] }, log: [line('ECHO', `${scene} at ${at}`)] }
  }
  return { state, log: [line('ERROR', `echo ${scene} needs exactly one of after / at`)] }
}
// One scene transition: every countdown moves one step closer (floor 0). Call it before this transition's effects.
export function tick(state: GameState): GameState {
  const counting = (e: EchoEntry): boolean => e.dueIn !== undefined && e.dueIn > 0
  if (!state.echoes.some(counting)) return state
  return { ...state, echoes: state.echoes.map((e) => (e.dueIn !== undefined && counting(e) ? { ...e, dueIn: e.dueIn - 1 } : e)) }
}
export function due(state: GameState): EchoEntry | undefined {
  return state.echoes.find((e) => (e.dueIn !== undefined && e.dueIn <= 0) || (e.atChapter !== undefined && e.atChapter === state.chapter))
}
// Removes the first due echo (insertion order) and returns its scene, or `scene: undefined` when nothing is due.
export function take(state: GameState): { state: GameState; scene: SceneId | undefined; log: LogLine[] } {
  const echo = due(state)
  if (echo === undefined) return { state, scene: undefined, log: [] }
  return { state: { ...state, echoes: state.echoes.filter((e) => e !== echo) }, scene: echo.scene, log: [line('ECHO', `fire ${echo.scene}`)] }
}
