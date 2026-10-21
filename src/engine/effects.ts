// engine/effects.ts — apply(effect, state): the closed effect vocabulary (STORY_FORMAT §5); pure, returns new state + log lines
import { clamp, DAY_RANGE, FEAR_RANGE, RES_RANGE, STAT_RANGE, TRUST_RANGE, type Range } from './bounds'
import { npcOf } from './conditions'
import { schedule } from './echoes'
import { applyDeed, surface } from './honor'
import { line, signed, type Applied, type LogLine } from './log'
import type { DeedTable, Effect, GameState } from './types'
export const PARTY_MAX = 3
const ok = (state: GameState, text: string): Applied => ({ state, log: [line('FX', text)] })
const fail = (state: GameState, text: string): Applied => ({ state, log: [line('ERROR', text)] })
function shift(s: GameState, id: string, key: 'trust' | 'fear', delta: number, range: Range): Applied {
  const n = npcOf(s, id)
  if (n === undefined) return fail(s, `${key} ${id}: unknown npc`)
  const v = clamp(n[key] + delta, range)
  return ok({ ...s, npc: { ...s.npc, [id]: { ...n, [key]: v } } }, `${key} ${id} ${signed(delta)} -> ${v}`)
}
// '+id' / '-id' lists (party, traits): returns the new list, or undefined when the sign is missing
function signedList(list: readonly string[], spec: string): string[] | undefined {
  const name = spec.slice(1)
  if (spec.startsWith('+')) return list.includes(name) ? [...list] : [...list, name]
  if (spec.startsWith('-')) return list.filter((x) => x !== name)
  return undefined
}
function party(s: GameState, spec: string): Applied {
  const id = spec.slice(1)
  const next = signedList(s.party, spec)
  if (next === undefined) return fail(s, `party ${spec}: must start with + or -`)
  if (spec.startsWith('+') && npcOf(s, id) === undefined) return fail(s, `party ${spec}: unknown npc`)
  if (next.length > PARTY_MAX) return fail(s, `party ${spec}: party is full (${PARTY_MAX})`)
  return ok({ ...s, party: next }, `party ${spec}`)
}
function trait(s: GameState, spec: string): Applied {
  const next = signedList(s.traits, spec)
  return next === undefined ? fail(s, `trait ${spec}: must start with + or -`) : ok({ ...s, traits: next }, `trait ${spec}`)
}
export function apply(e: Effect, s: GameState, deeds: DeedTable): Applied {
  switch (e[0]) {
    case 'honor': return applyDeed(s, e[1], e[2], 1, deeds)
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
    case 'trust': return shift(s, e[1], 'trust', e[2], TRUST_RANGE)
    case 'fear': return shift(s, e[1], 'fear', e[2], FEAR_RANGE)
    case 'party': return party(s, e[1])
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
    case 'reveal': return surface(s, e[1])
    case 'echo': return schedule(s, e[1])
    case 'time': {
      const day = e[1].day === undefined ? s.day : clamp(e[1].day, DAY_RANGE)
      const phase = e[1].phase ?? s.phase
      return ok({ ...s, day, phase }, `time day ${day} ${phase}`)
    }
    default: return fail(s, `unknown effect ${JSON.stringify(e)}`)
  }
}
// Applies a list in order. An unwitnessed deed's remainder is owed to the next `secret` in the same list (deed first, then secret);
// a remainder with no secret after it is forfeited (logged).
export function applyAll(list: readonly Effect[] | undefined, state: GameState, deeds: DeedTable): Applied {
  let cur = state
  const log: LogLine[] = []
  let held = 0
  for (const e of list ?? []) {
    const r = apply(e, cur, deeds)
    cur = r.state
    log.push(...r.log)
    held += r.owed ?? 0
    if (e[0] === 'secret' && held !== 0) {
      cur = { ...cur, owed: { ...cur.owed, [e[1]]: (cur.owed[e[1]] ?? 0) + held } }
      log.push(line('SECRET', `${e[1]} owes ${signed(held)} honor on reveal`))
      held = 0
    }
  }
  if (held !== 0) log.push(line('HONOR', `unwitnessed remainder ${signed(held)} forfeited: no secret after the deed`))
  return { state: cur, log }
}
