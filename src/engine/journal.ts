// engine/journal.ts — journalOf(state, story): what the Journal shows (HONOR §7, UI_UX §2): the deed list newest first, and the people the game remembers, party first; the UI never reads story data
import type { GameState, Story } from './types'
export interface DeedView {
  tag: string
  witnessed: boolean
  surfaced: boolean // a hidden deed that has come out
  day: number
  delta: number // honor it moved when it was recorded (a surfaced deed: the honor paid then)
  who: { id: string; delta: number }[] // companions whose trust moved, and by how much
}
export interface PersonView {
  id: string
  name: string
  alive: boolean
  inParty: boolean
  trust: number
  fear: number
  perk: string | undefined // the card line of their perk, when the engine applies one
}
export interface JournalView {
  deeds: DeedView[]
  people: PersonView[]
}
// A person is known when you have met them (`GameState.met`, D31), travel with you, are dead, or trust or fear has moved from where it started (that last rule covers a v3 save, which has no `met`; a fear that only faded at a chapter change does not count).
function known(s: GameState, story: Story, id: string): boolean {
  const n = s.npc[id]
  if (n === undefined) return false
  if (s.party.includes(id) || s.met.includes(id) || !n.alive) return true
  const start = Object.hasOwn(story.npcs, id) ? story.npcs[id] : undefined
  return start !== undefined && (n.trust !== start.trust || n.fear > start.fear)
}
export function journalOf(s: GameState, story: Story): JournalView {
  const deeds = [...s.deeds].reverse().map((d): DeedView => ({ tag: d.tag, witnessed: d.witnessed, surfaced: d.surfaced, day: d.day, delta: d.delta, who: Object.entries(d.who).map(([id, delta]) => ({ id, delta })) }))
  const ids = [...s.party, ...Object.keys(s.npc).filter((id) => !s.party.includes(id))]
  const people = ids.filter((id) => known(s, story, id)).map((id): PersonView => {
    const n = s.npc[id]
    const perk = Object.hasOwn(story.perks, id) ? story.perks[id] : undefined
    return { id, name: Object.hasOwn(story.npcs, id) ? (story.npcs[id]?.name ?? id) : id, alive: n?.alive ?? false, inParty: s.party.includes(id), trust: n?.trust ?? 0, fear: n?.fear ?? 0, perk: perk?.text }
  })
  return { deeds, people }
}
