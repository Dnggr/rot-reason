// scripts/lintRefs.ts — reference checks: flags, characters, deed tags, backgrounds, secrets, plus the style warnings
import { SYS_SCENES } from '../src/engine/ids'
import type { Scene, Story } from '../src/engine/types'
import { conditionsOf, effectsOf, flatten, speakersOf, wordCount } from './lintWalk'
const NPC_CONDITIONS: ReadonlySet<string> = new Set(['alive', 'party', 'trust', 'fear'])
const unique = <T>(xs: T[]): T[] => [...new Set(xs)]
export function lintRefs(story: Story, flags: Readonly<Record<string, string>>, errors: string[], warnings: string[]): void {
  const scenes = Object.values(story.scenes).filter((s) => !SYS_SCENES.includes(s.id))
  const setters = new Set<string>()
  const readers = new Set<string>()
  const held = new Set<string>()
  const revealed: [string, string][] = []
  const npcs = (where: string, id: string): void => {
    if (!Object.hasOwn(story.npcs, id)) errors.push(`${where}: unknown character ${id}`)
  }
  const flag = (where: string, id: string, into: Set<string>): void => {
    into.add(id)
    if (!Object.hasOwn(flags, id)) errors.push(`${where}: unknown flag ${id}`)
  }
  for (const s of scenes) {
    for (const w of s.who ?? []) npcs(`${s.id} who`, w)
    for (const w of speakersOf(s)) npcs(`${s.id} say`, w)
    for (const c of conditionsOf(s)) {
      if ('all' in c || 'any' in c || 'not' in c) continue
      if (c[0] === 'flag') flag(s.id, c[1], readers)
      if (NPC_CONDITIONS.has(c[0])) npcs(`${s.id} condition`, c[1])
      if (c[0] === 'bg' && !Object.hasOwn(story.backgrounds, c[1])) errors.push(`${s.id}: unknown background ${c[1]}`)
    }
    for (const e of effectsOf(s)) {
      if (e[0] === 'set' || e[0] === 'clear') flag(s.id, e[1], setters)
      if (e[0] === 'honor' && !Object.hasOwn(story.deeds, e[1])) errors.push(`${s.id}: unknown deed tag ${e[1]}`)
      if (e[0] === 'trust' || e[0] === 'fear' || e[0] === 'kill') npcs(`${s.id} ${e[0]}`, e[1])
      if (e[0] === 'party') npcs(`${s.id} party`, e[1].slice(1))
      if (e[0] === 'secret') held.add(e[1])
      if (e[0] === 'reveal') revealed.push([s.id, e[1]])
    }
  }
  for (const r of story.endings) {
    for (const c of r.if === undefined ? [] : flatten(r.if)) {
      if ('all' in c || 'any' in c || 'not' in c) continue
      if (c[0] === 'flag') flag(`ending ${r.id}`, c[1], readers)
      if (NPC_CONDITIONS.has(c[0])) npcs(`ending ${r.id}`, c[1]) // the same npc conditions as a scene's (D32)
      if (c[0] === 'bg' && !Object.hasOwn(story.backgrounds, c[1])) errors.push(`ending ${r.id}: unknown background ${c[1]}`)
    }
  }
  for (const [where, id] of revealed) if (!held.has(id)) warnings.push(`${where}: reveal ${id} but no scene holds that secret`)
  for (const f of Object.keys(flags)) {
    if (setters.has(f) && !readers.has(f)) warnings.push(`flag ${f} is set but never read`)
    if (readers.has(f) && !setters.has(f)) warnings.push(`flag ${f} is read but never set`)
  }
  lintStyle(scenes, warnings)
}
// Warnings: long scenes, fake choices (identical outcomes), no always-open choice, chapters without an honor tag.
function lintStyle(scenes: Scene[], warnings: string[]): void {
  const honorIn = new Map<string, boolean>()
  for (const s of scenes) {
    const ch = s.id.split('.')[0] ?? s.id
    honorIn.set(ch, (honorIn.get(ch) ?? false) || effectsOf(s).some((e) => e[0] === 'honor'))
    if (wordCount(s) > 90) warnings.push(`${s.id}: text is ${wordCount(s)} words (max 90)`)
    const cs = s.choices ?? []
    const outcome = (c: (typeof cs)[number]): string => JSON.stringify([c.fx, c.to, c.check, c.echo])
    if (cs.length > 1 && unique(cs.map(outcome)).length === 1) warnings.push(`${s.id}: every choice has the same outcome (fake choice)`)
    if (cs.length > 0 && cs.every((c) => c.if !== undefined || c.lock !== undefined)) warnings.push(`${s.id}: every choice has if/lock (possible soft-lock)`)
  }
  for (const [ch, ok] of honorIn) if (!ok) warnings.push(`chapter ${ch}: no honor tag used`)
}
