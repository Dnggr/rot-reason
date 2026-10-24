// ui/vitals.ts — when the low-vitals visuals show (UI_UX §7): a red vignette at low HP, a flicker on the narration at low Reason
import { GLITCH_BELOW, type Hud } from '../engine/select'
export const LOW_HP = 2 // hp 0 is death, so this is the last two points
export const isLowHp = (stats: Hud['stats']): boolean => stats.hp <= LOW_HP
export const isLowReason = (stats: Hud['stats']): boolean => stats.reason < GLITCH_BELOW // the same line where the engine swaps in a scene's `glitch` text
