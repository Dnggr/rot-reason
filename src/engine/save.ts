// engine/save.ts — save envelope: makeSave, migrate, replay, loadSave (snapshot -> replay -> checkpoint), storage injected (ARCHITECTURE §6)
import { CONTINUE_TOKEN } from './choose'
import { SAVE_VERSION, startGame } from './init'
import { findScene, SYS_ERROR } from './ids'
import { pushLog } from './log'
import { v1to2, v2to3, v3to4 } from './migrations'
import { reduce } from './reducer'
import { saveHeadSchema, validState } from './stateSchema'
import type { Action, ChoiceId, GameState, SaveData, Story } from './types'
export const SAVE_KEY = 'rr_save_v1'
export type Migrations = Readonly<Record<number, (raw: Record<string, unknown>) => Record<string, unknown>>> // v -> upgrades v to v+1
export const MIGRATIONS: Migrations = { 1: v1to2, 2: v2to3, 3: v3to4 }
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
export type LoadResult = { ok: true; save: SaveData; via: 'snapshot' | 'replay' | 'checkpoint' } | { ok: false; errors: string[] }
const CHOICE_IDS: readonly ChoiceId[] = ['a', 'b', 'c', 'd']
function toAction(token: string): Action | undefined {
  if (token === CONTINUE_TOKEN) return { type: 'CONTINUE' }
  const choice = CHOICE_IDS.find((c) => c === token)
  return choice === undefined ? undefined : { type: 'CHOOSE', choice }
}
const message = (e: unknown): string => (e instanceof Error ? e.message : String(e))
// The checkpoint moves to the current state whenever the player stands on a gate scene (ARCHITECTURE §5.12). `savedAt` comes from the storage layer.
export function makeSave(state: GameState, checkpoint: GameState | null, story: Story, savedAt: number): SaveData {
  const gate = findScene(story, state.scene)?.tags?.includes('gate') === true
  return { v: SAVE_VERSION, seed: state.seed, bg: state.bg, name: state.name, history: state.history, snapshot: state, checkpoint: gate ? state : checkpoint, savedAt }
}
export function migrate(raw: unknown, table: Migrations = MIGRATIONS, target: number = SAVE_VERSION): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new Error('save is not an object')
  let cur: Record<string, unknown> = Object.fromEntries(Object.entries(raw))
  let v = cur['v']
  if (typeof v !== 'number') throw new Error('save has no version')
  if (v > target) throw new Error(`save v${v} is newer than this game (v${target})`)
  while (v < target) {
    const up = table[v]
    if (up === undefined) throw new Error(`no migration from save v${v}`)
    cur = { ...up(cur), v: v + 1 }
    v += 1
  }
  return cur
}
// Rebuilds a game from seed + bg + name + history ("scene:choice", "scene:>"); any step that is not applied is a failure.
export function replay(story: Story, start: { seed: number; bg: string; name: string }, history: readonly string[]): { state: GameState } | { error: string } {
  let s: GameState
  try {
    const r = startGame(story, start.bg, start.name, start.seed)
    s = pushLog(r.state, r.log)
  } catch (e) {
    return { error: `replay start: ${message(e)}` }
  }
  for (const [i, h] of history.entries()) {
    const cut = h.lastIndexOf(':')
    const action = toAction(h.slice(cut + 1))
    if (action === undefined || cut < 1 || s.scene !== h.slice(0, cut)) return { error: `replay step ${i}: ${h} does not fit scene ${s.scene}` }
    const next = reduce(s, action, story)
    if (next.history.length !== s.history.length + 1 || next.scene === SYS_ERROR) return { error: `replay step ${i}: ${h} was not applied` }
    s = next
  }
  return { state: s }
}
// snapshot if it is valid; else replay seed + history; else the last chapter checkpoint; else the reasons it failed.
export function loadSave(raw: unknown, story: Story): LoadResult {
  let obj: Record<string, unknown>
  try {
    obj = migrate(raw)
  } catch (e) {
    return { ok: false, errors: [message(e)] }
  }
  const head = saveHeadSchema.safeParse(obj)
  if (!head.success) return { ok: false, errors: [`save envelope: ${head.error.message}`] }
  const h = head.data
  const checkpoint = h.checkpoint === null ? undefined : validState(h.checkpoint, story)
  const make = (state: GameState, via: 'snapshot' | 'replay' | 'checkpoint'): LoadResult => ({
    ok: true, via,
    save: { v: SAVE_VERSION, seed: h.seed, bg: h.bg, name: h.name, history: state.history, snapshot: state, checkpoint: checkpoint ?? null, savedAt: h.savedAt },
  })
  const snapshot = validState(h.snapshot, story)
  if (snapshot !== undefined) return make(snapshot, 'snapshot')
  const re = replay(story, h, h.history)
  if ('state' in re) return make(re.state, 'replay')
  if (checkpoint !== undefined) return make(checkpoint, 'checkpoint')
  return { ok: false, errors: ['snapshot is invalid', re.error, 'no usable checkpoint'] }
}
export function writeSave(store: KeyValueStore, save: SaveData, key: string = SAVE_KEY): void {
  store.setItem(key, JSON.stringify(save))
}
// undefined = nothing stored; otherwise the load result (bad JSON is an error result, never a throw).
export function readSave(store: KeyValueStore, story: Story, key: string = SAVE_KEY): LoadResult | undefined {
  const raw = store.getItem(key)
  if (raw === null) return undefined
  try {
    return loadSave(JSON.parse(raw), story)
  } catch (e) {
    return { ok: false, errors: [`save is not valid JSON: ${message(e)}`] }
  }
}
