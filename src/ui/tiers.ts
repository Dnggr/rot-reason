// ui/tiers.ts — pure: the full-screen banner when honor enters a new tier (HONOR §2, UI_UX §7, D30)
import { tierOf } from '../engine/honor'
import type { GameState, Tier } from '../engine/types'
export const BANNER_MS = 3000 // it also goes at a tap, so nobody waits on a timer
export interface Banner {
  tier: Tier
  text: string
}
// A banner only when the tier changed between the two states; several tiers at once give one banner, for the one honor ends in.
export function tierBanner(prev: GameState, next: GameState, lines: Readonly<Record<Tier, string>>): Banner | undefined {
  const to = tierOf(next.honor)
  return tierOf(prev.honor) === to ? undefined : { tier: to, text: lines[to] }
}
