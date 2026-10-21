// story/traits.ts — check bonuses granted by traits (GAME_DESIGN §4 checks; CHARACTERS perks). Add a row to balance.
import type { TraitBonuses } from '../engine/types'
export const TRAIT_BONUS: TraitBonuses = {
  Bruiser: { grit: 2 }, // Brick's perk: Grit checks +2 while he is with you (the story adds/removes the trait)
  Signal: { wits: 1 }, // Juno's perk: Wits checks involving tech
}
