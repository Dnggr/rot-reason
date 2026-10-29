// story/traits.ts — check bonuses granted by traits (GAME_DESIGN §4 checks; CHARACTERS perks). Add a row to balance.
import type { Perk, TraitBonuses } from '../engine/types'
export const TRAIT_BONUS: TraitBonuses = {
  Bruiser: { grit: 2 }, // Brick's perk (PERKS): Grit checks +2 while he is in the party
  Signal: { wits: 1 }, // Juno's perk: Wits checks involving tech
  Hardened: {}, // a trait the story gives (t.gate) with no check bonus yet; a story-only trait needs a row, even an empty one, so lint:story and saves know the id (M3 s6)
}
// Companion perks the engine really applies (D30): while the companion is alive and in the party, `trait` counts in every check. The card shows `text`. Other perks (CHARACTERS.md) are listed here when their mechanic exists.
export const PERKS: Readonly<Record<string, Perk>> = {
  brick: { trait: 'Bruiser', text: 'Grit checks +2 while he is with you.' },
  juno: { trait: 'Signal', text: 'Wits checks +1 while she is with you.' },
}