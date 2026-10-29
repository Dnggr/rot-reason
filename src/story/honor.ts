// story/honor.ts — deed table: tag -> honor delta (HONOR.md §3). The only place to balance honor.
import type { DeedTable } from '../engine/types'
export const DEEDS: DeedTable = {
  mercy: 5,
  share: 5,
  protect: 8,
  sacrifice: 12,
  keep_word: 6,
  honest: 2,
  lie: -3,
  lie_harm: -6, // a lie that harms someone (HONOR §3: "-6 if it harms someone")
  steal: -6, // from survivors; looting the dead is no deed at all
  abandon: -10,
  kill_surrender: -12,
  betray: -15,
  torture: -15,
  murder: -20,
  intimidate: -4, // the fear on the target is a separate ['fear', id, n] effect
  cruelty_show: -8, // fear in witnesses is a separate ['fear', id, n] effect
}