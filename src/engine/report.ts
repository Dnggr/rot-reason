// engine/report.ts — the debug report (ARCHITECTURE §7): version, seed, history, last 30 log lines, state, note. Pure, so the error boundary can build it too.
import { formatEntry } from './log'
import type { GameState } from './types'
export const REPORT_LOG_LINES = 30
export interface ReportInput {
  version: string
  state: GameState | undefined // undefined: the app broke before a game existed
  note: string | undefined // what the player typed, if anything
  error: string | undefined // the error that triggered the report, if any
}
export interface DebugReport {
  app: 'rot-reason'
  version: string
  note: string | null
  error: string | null
  seed: number | null
  bg: string | null
  name: string | null
  scene: string | null
  history: string[]
  log: string[] // greppable, newest last
  state: GameState | null
}
export function buildReport(i: ReportInput): DebugReport {
  const s = i.state
  return {
    app: 'rot-reason', version: i.version, note: i.note || null, error: i.error || null,
    seed: s?.seed ?? null, bg: s?.bg ?? null, name: s?.name ?? null, scene: s?.scene ?? null,
    history: s === undefined ? [] : [...s.history], log: s === undefined ? [] : s.log.slice(-REPORT_LOG_LINES).map(formatEntry), state: s ?? null,
  }
}
export const reportText = (r: DebugReport): string => JSON.stringify(r, null, 2)
