// engine/log.ts — typed log lines: build them, append to the 200-entry ring buffer, format them greppable (ARCHITECTURE §7)
import type { GameState, LogEntry } from './types'
export const LOG_MAX = 200
export type LogLine = Omit<LogEntry, 'n'>
// A deed that was just applied: its tag, whether anyone saw it, and the repeat factor (HONOR §3 rule 2) its honor and approval were scaled by.
export interface Deed {
  tag: string
  witnessed: boolean
  factor: number
}
// What every pure step returns. `owed` is the honor remainder of an unwitnessed deed and `deed` says which deed it was; effects.applyAll hands both to the next `secret`.
export interface Applied {
  state: GameState
  log: LogLine[]
  owed?: number
  deed?: Deed
}
export function line(kind: LogEntry['kind'], text: string): LogLine {
  return { kind, text }
}
export function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`
}
export function pushLog(state: GameState, lines: readonly LogLine[]): GameState {
  if (lines.length === 0) return state
  let n = state.log[state.log.length - 1]?.n ?? 0
  const added: LogEntry[] = lines.map((l) => ({ n: ++n, kind: l.kind, text: l.text }))
  return { ...state, log: [...state.log, ...added].slice(-LOG_MAX) }
}
export function formatEntry(e: LogEntry): string {
  return `[${String(e.n).padStart(3, '0')}] ${e.kind} ${e.text}`
}