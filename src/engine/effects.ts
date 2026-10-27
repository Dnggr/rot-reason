// engine/effects.ts — apply(effect, state): the closed effect vocabulary (STORY_FORMAT §5); pure, returns new state + log lines
import { clamp, DAY_RANGE, FEAR_RANGE, RES_RANGE, STAT_RANGE, TRUST_RANGE } from './bounds'
import { npcOf } from './conditions'
import { addDeed, reactors } from './deeds'
import { schedule } from './echoes'
import { applyDeed, surface } from './honor'
import { line, signed, type Applied, type LogLine } from './log'
import { meet } from './met'
import { NO_SOCIAL, PARTY_MAX, party, react, shift, signedList, walkouts } from './relations'
import type { DeedTable, Effect, GameState, Social } from './types'
export { PARTY_MAX }
const ok = (state: GameState, text: string): Applied => ({ state, log: [line('FX', text)] })
const fail = (state: GameState, text: string): Applied => ({ state, log: [line('ERROR', text)] })
function trait(s: GameState, spec: string): Applied {
  const next = signedList(s.traits, spec)
  return next === undefined ? fail(s, `trait ${spec}: must start with + or -`) : ok({ ...s, traits: next }, `trait ${spec}`)
}
export const UNKNOWN_DEED = 'unknown' // the Journal's tag for honor a revealed secret paid when no deed is on record
// A secret comes out: its owed honor applies (honor.surface), then the party reacts to every deed it hid, in full (D29). Each hidden deed joins the Journal's list as `surfaced` (D30); the first carries the honor paid.
function reveal(s: GameState, id: string, social: Social): Applied {
  const tags = s.secrets.includes(id) ? (s.owedTags[id] ?? []) : []
  const r = surface(s, id)
  let cur = r.state
  const log = [...r.log]
  const paid = cur.honor - s.honor
  tags.forEach((tag, i) => {
    const seen = react(cur, tag, 1, social)
    cur = addDeed(seen.state, { tag, witnessed: false, surfaced: true, day: s.day, delta: i === 0 ? paid : 0, who: reactors(cur, seen.state) })
    log.push(...seen.log)
  })
  // A secret with honor owed but no hidden deeds on record (a v1 save, D29) still shows in the Journal: one `unknown` deed carries the honor paid (D32).
  if (tags.length === 0 && paid !== 0) cur = addDeed(cur, { tag: UNKNOWN_DEED, witnessed: false, surfaced: true, day: s.day, delta: paid, who: {} })
  return { state: cur, log }
}
export function apply(e: Effect, s: GameState, deeds: DeedTable, social: Social = NO_SOCIAL): Applied {
  switch (e[0]) {
    case 'honor': {
      const r = applyDeed(s, e[1], e[2], 1, deeds)
      if (r.deed === undefined) return r
      const seen = r.deed.witnessed ? react(r.state, e[1], r.deed.factor, social) : { state: r.state, log: [] } // unwitnessed: nobody reacts until the secret surfaces
      const rec = { tag: e[1], witnessed: r.deed.witnessed, surfaced: false, day: s.day, delta: r.state.honor - s.honor, who: reactors(s, seen.state) }
      return { ...r, state: addDeed(seen.state, rec), log: [...r.log, ...seen.log] }
    }
    case 'stat': {
      const v = clamp(s.stats[e[1]] + e[2], STAT_RANGE[e[1]])
      return ok({ ...s, stats: { ...s.stats, [e[1]]: v } }, `stat ${e[1]} ${signed(e[2])} -> ${v}`)
    }
    case 'res': {
      const v = clamp(s.res[e[1]] + e[2], RES_RANGE)
      return ok({ ...s, res: { ...s.res, [e[1]]: v } }, `res ${e[1]} ${signed(e[2])} -> ${v}`)
    }
    case 'set': return ok({ ...s, flags: { ...s.flags, [e[1]]: true } }, `set ${e[1]}`)
    case 'clear': {
      const flags = { ...s.flags }
      delete flags[e[1]]
      return ok({ ...s, flags }, `clear ${e[1]}`)
    }
    case 'trust': case 'fear': { // moving someone's numbers means you have met them (D31)
      const r = shift(s, e[1], e[0], e[2], e[0] === 'trust' ? TRUST_RANGE : FEAR_RANGE)
      return { ...r, state: meet(r.state, [e[1]]) }
    }
    case 'party': {
      const r = party(s, e[1], social)
      return { ...r, state: meet(r.state, r.state.party) } // everyone who travels with you has been met
    }
    case 'kill': {
      const n = npcOf(s, e[1])
      if (n === undefined) return fail(s, `kill ${e[1]}: unknown npc`)
      return ok({ ...s, npc: { ...s.npc, [e[1]]: { ...n, alive: false } }, party: s.party.filter((x) => x !== e[1]) }, `kill ${e[1]}`)
    }
    case 'trait': return trait(s, e[1])
    case 'secret': {
      if (s.secrets.includes(e[1])) return ok(s, `secret ${e[1]} already held`)
      return { state: { ...s, secrets: [...s.secrets, e[1]] }, log: [line('SECRET', `hold ${e[1]}`)] }
    }
    case 'reveal': return reveal(s, e[1], social)
    case 'echo': return schedule(s, e[1])
    case 'time': {
      const day = e[1].day === undefined ? s.day : clamp(e[1].day, DAY_RANGE)
      if (day < s.day) return fail(s, `time day ${e[1].day} is before day ${s.day}: time does not run backwards, effect ignored`) // M3 s6, D34
      const phase = e[1].phase ?? s.phase
      return ok({ ...s, day, phase }, `time day ${day} ${phase}`)
    }
    default: return fail(s, `unknown effect ${JSON.stringify(e)}`)
  }
}
// Applies a list in order. An unwitnessed deed's remainder and tag are held by the next `secret` in the same list (deed first, then secret, D15, D29):
// the secret then owes the honor and hides the deed until `reveal`. A deed with no secret after it is forfeited (logged). Companions who no longer stand you walk out at the end.
export function applyAll(list: readonly Effect[] | undefined, state: GameState, deeds: DeedTable, social: Social = NO_SOCIAL): Applied {
  let cur = state
  const log: LogLine[] = []
  let held = 0
  let hidden: string[] = []
  for (const e of list ?? []) {
    const r = apply(e, cur, deeds, social)
    cur = r.state
    log.push(...r.log)
    held += r.owed ?? 0
    if (r.deed !== undefined && !r.deed.witnessed) hidden = [...hidden, r.deed.tag]
    if (e[0] === 'secret' && (held !== 0 || hidden.length > 0)) {
      cur = { ...cur, owed: held === 0 ? cur.owed : { ...cur.owed, [e[1]]: (cur.owed[e[1]] ?? 0) + held }, owedTags: { ...cur.owedTags, [e[1]]: [...(cur.owedTags[e[1]] ?? []), ...hidden] } }
      log.push(line('SECRET', `${e[1]} hides ${hidden.join(', ')} and owes ${signed(held)} honor on reveal`))
      held = 0
      hidden = []
    }
  }
  if (hidden.length > 0) log.push(line('HONOR', `unwitnessed ${hidden.join(', ')} (remainder ${signed(held)}) forfeited: no secret after the deed`))
  const out = walkouts(cur, social)
  return { state: out.state, log: [...log, ...out.log] }
}
