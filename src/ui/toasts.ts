// ui/toasts.ts — toast lines from a state diff: honor, vitals, resources, who will remember (UI_UX §7); pure
import { RES_KEYS } from '../engine/choices'
import type { GameState, StatKey } from '../engine/types'
import { shortName } from './names'
import { S } from './strings'
export const MAX_TOASTS = 5
const STAT_KEYS: readonly StatKey[] = ['hp', 'reason', 'rot']
const signed = (n: number): string => (n > 0 ? `+${n}` : `${n}`)
export function diffToasts(prev: GameState, next: GameState): string[] {
  const out: string[] = []
  if (next.honor !== prev.honor) out.push(`${S.honor} ${signed(next.honor - prev.honor)}`)
  for (const k of STAT_KEYS) if (next.stats[k] !== prev.stats[k]) out.push(`${signed(next.stats[k] - prev.stats[k])} ${S.stat[k]}`)
  for (const k of RES_KEYS) if (next.res[k] !== prev.res[k]) out.push(`${signed(next.res[k] - prev.res[k])} ${S.res[k]}`)
  for (const [id, n] of Object.entries(next.npc)) {
    const p = prev.npc[id]
    if (p !== undefined && (p.trust !== n.trust || p.fear !== n.fear)) out.push(S.remember(shortName(id)))
  }
  return out.slice(0, MAX_TOASTS)
}
