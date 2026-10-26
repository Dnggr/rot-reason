// story/tiers.ts — the line of the full-screen banner when honor enters a tier (HONOR §2, D30). One line each; nobody says the dead have a name (D23).
import type { Tier } from '../engine/types'
export const TIER_LINES: Readonly<Record<Tier, string>> = {
  T1: 'Doors close before you reach them. Everyone has heard what you are.',
  T2: 'People begin to whisper your name.',
  T3: 'Nobody here knows what to make of you.',
  T4: 'Strangers nod as you pass, and mean it.',
  T5: 'They step aside for you. Some of them follow.',
}
