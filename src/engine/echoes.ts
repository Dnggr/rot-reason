// engine/echoes.ts — delayed consequences: schedule, tick, due, take (ARCHITECTURE §4; reducer order: tick -> fx -> take)
import { line, type Applied, type LogLine } from './log'
import type { EchoEntry, EchoSpec, Effect, GameState, SceneId } from './types'
// `after: N` = N scenes play normally, then the echo fires at the next transition. `at: 'c4'` = due while state.chapter is 'c4'.
// An identical echo already pending (same scene, same countdown or same chapter) is not stacked: it would play twice in a row (M3 s7, D35).
export function schedule(state: GameState, spec: EchoSpec): Applied {
  const { scene, after, at } = spec
  const add = (entry: EchoEntry, text: string): Applied => {
    const twin = state.echoes.some((e) => e.scene === entry.scene && e.dueIn === entry.dueIn && e.atChapter === entry.atChapter)
    return twin ? { state, log: [line('ECHO', `${text} is already pending, not scheduled twice`)] } : { state: { ...state, echoes: [...state.echoes, entry] }, log: [line('ECHO', text)] }
  }
  if (after !== undefined && at === undefined) return add({ scene, dueIn: after }, `${scene} in ${after}`)
  if (at !== undefined && after === undefined) return add({ scene, atChapter: at }, `${scene} at ${at}`)
  return { state, log: [line('ERROR', `echo ${scene} needs exactly one of after / at`)] }
}
// Echoes an `on` list plants run in `enter`, which is after that transition's tick, so they get one more step than a choice `echo` (planted before the leave): both then mean "N scenes play normally" (M3 s8, D36).
export const onEntry = (list: readonly Effect[] | undefined): readonly Effect[] | undefined =>
  list?.map((e): Effect => (e[0] === 'echo' && e[1].after !== undefined ? ['echo', { ...e[1], after: e[1].after + 1 }] : e))
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