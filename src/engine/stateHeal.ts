// engine/stateHeal.ts — a save from an older build: fill or drop the ids the story changed (npcs, flags, met, echoes, deeds, traits) so the player keeps the run; scene / background / chapter are never healed (M3 s6, D34). Pure.
import { UNKNOWN_DEED } from './effects'
import { findScene } from './ids'
import { line, pushLog } from './log'
import { chaptersOf, knownTraits } from './stateRefs'
import type { GameState, NpcState, Story } from './types'
const has = (table: Readonly<Record<string, unknown>>, id: string): boolean => Object.hasOwn(table, id)
const only = <T>(rec: Readonly<Record<string, T>>, ok: (id: string) => boolean): Record<string, T> => Object.fromEntries(Object.entries(rec).filter(([id]) => ok(id)))
// Returns the state the current story can run, plus one note per kind of repair (also written to the log as FX lines). Nothing to repair = the same object back.
export function healState(s: GameState, story: Story): { state: GameState; notes: string[] } {
  const notes: string[] = []
  const note = (what: string, ids: readonly string[]): void => void (ids.length > 0 && notes.push(`${what}: ${[...new Set(ids)].join(', ')}`))
  const npcKnown = (id: string): boolean => has(story.npcs, id)
  const chapters = chaptersOf(story)
  const traits = knownTraits(story)
  const newcomers = Object.entries(story.npcs).filter(([id]) => !has(s.npc, id))
  note('npc added from the story', newcomers.map(([id]) => id))
  const added: Record<string, NpcState> = Object.fromEntries(newcomers.map(([id, n]) => [id, { alive: true, trust: n.trust, fear: n.fear }]))
  note('npc dropped (not in the story)', Object.keys(s.npc).filter((id) => !npcKnown(id)))
  note('flag dropped (not in the story)', Object.keys(s.flags).filter((f) => !has(story.flags, f)))
  note('met dropped (not an npc)', s.met.filter((m) => !npcKnown(m)))
  note('party member dropped (not an npc)', s.party.filter((p) => !npcKnown(p)))
  const lost = s.echoes.filter((e) => findScene(story, e.scene) === undefined || (e.atChapter !== undefined && !chapters.has(e.atChapter)))
  note('echo dropped (its scene or chapter is gone)', lost.map((e) => e.scene))
  const deedKnown = (tag: string): boolean => tag === UNKNOWN_DEED || has(story.deeds, tag)
  note('deed dropped from the Journal (unknown tag)', s.deeds.filter((d) => !deedKnown(d.tag)).map((d) => d.tag))
  note('deed count dropped (not a deed tag)', Object.keys(s.deedCount).filter((k) => !has(story.deeds, k)))
  note('trait dropped (not a trait of the story)', s.traits.filter((t) => !traits.has(t)))
  if (notes.length === 0) return { state: s, notes }
  const healed: GameState = {
    ...s,
    npc: { ...only(s.npc, npcKnown), ...added },
    flags: only(s.flags, (f) => has(story.flags, f)) as GameState['flags'],
    met: s.met.filter(npcKnown),
    party: s.party.filter(npcKnown),
    echoes: s.echoes.filter((e) => !lost.includes(e)),
    deeds: s.deeds.filter((d) => deedKnown(d.tag)).map((d) => ({ ...d, who: only(d.who, npcKnown) })),
    deedCount: only(s.deedCount, (k) => has(story.deeds, k)),
    traits: s.traits.filter((t) => traits.has(t)),
  }
  return { state: pushLog(healed, notes.map((n) => line('FX', `healed on load, the story changed: ${n}`))), notes }
}
