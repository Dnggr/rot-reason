// scripts/lintTime.ts — warns when a `time` effect is earlier (a day, or a phase of the same day) than a moment some route has already reached: the engine ignores it with an ERROR (M3 s6 / s7, D34, D35). A hint from the story graph, not a proof.
import { clamp, DAY_RANGE, PHASES } from '../src/engine/bounds'
import { RESUME, SYS_SCENES } from '../src/engine/ids'
import type { Effect, Scene, Story } from '../src/engine/types'
import { echoTargetsOf } from './lintWalk'
type Change = Extract<Effect, readonly ['time', unknown]>[1]
interface Pos { day: number; phase: number } // a moment: the day and the index of the phase in PHASES
const START: Pos = { day: 1, phase: 0 } // a new game: day 1, dawn
const after = (a: Pos, b: Pos): boolean => a.day > b.day || (a.day === b.day && a.phase > b.phase)
const later = (a: Pos, b: Pos): Pos => (after(b, a) ? b : a)
// What `effects.apply` does with a time change: a day or phase earlier than now is refused and changes nothing; otherwise the change applies (an omitted part stays).
function move(now: Pos, t: Change): { to: Pos; back: 'day' | 'phase' | undefined } {
  const day = t.day === undefined ? now.day : clamp(t.day, DAY_RANGE)
  const phase = t.phase === undefined ? now.phase : PHASES.indexOf(t.phase)
  const back = day < now.day ? 'day' : day === now.day && phase < now.phase ? 'phase' : undefined
  return { to: back === undefined ? { day, phase } : now, back }
}
const timeOf = (e: Effect): Change | undefined => (e[0] === 'time' ? e[1] : undefined)
interface Route { to: string; list: readonly Effect[]; where: string } // one way out of a scene: where it goes and the effects that run on the way (a choice's fx, then its check branch's)
function routesOf(s: Scene): Route[] {
  const out: Route[] = (s.choices ?? []).flatMap((c) => {
    const own = c.fx ?? []
    if (c.check === undefined) return c.to === undefined ? [] : [{ to: c.to, list: own, where: `${s.id}:${c.id}` }]
    return [{ to: c.check.pass.to, list: [...own, ...(c.check.pass.fx ?? [])], where: `${s.id}:${c.id} pass` }, { to: c.check.fail.to, list: [...own, ...(c.check.fail.fx ?? [])], where: `${s.id}:${c.id} fail` }]
  })
  return s.next === undefined ? out : [...out, { to: s.next, list: [], where: s.id }]
}
const run = (list: readonly Effect[], from: Pos): Pos => list.reduce((now, e) => { const t = timeOf(e); return t === undefined ? now : move(now, t).to }, from)
// The latest moment any route can have reached when it enters each scene (day 1, dawn at the start); moments only grow, so this settles.
function arrival(story: Story): Map<string, Pos> {
  const seen = new Map<string, Pos>([[story.start, START]])
  const push = (to: string, p: Pos): boolean => {
    const cur = seen.get(to)
    if (to === RESUME || SYS_SCENES.includes(to) || (cur !== undefined && !after(p, cur))) return false
    seen.set(to, p)
    return true
  }
  for (let grew = true; grew; ) {
    grew = false
    for (const [id, into] of [...seen]) {
      const s = Object.hasOwn(story.scenes, id) ? story.scenes[id] : undefined
      if (s === undefined) continue
      const base = run(s.on ?? [], into)
      for (const r of routesOf(s)) grew = push(r.to, run(s.time === undefined ? r.list : [...r.list, ['time', s.time]], base)) || grew
      for (const t of echoTargetsOf(s)) grew = push(t, base) || grew // an echo comes back later, so this is the least it can be
    }
  }
  return seen
}
export function lintTime(story: Story, warnings: string[]): void {
  const arrived = arrival(story)
  const hint = (where: string, t: Change, now: Pos, back: 'day' | 'phase', when: string): void => void warnings.push(back === 'day'
    ? `${where}: time day ${t.day} is before day ${now.day}, which a route has ${when}; the engine ignores it with an ERROR`
    : `${where}: time phase ${t.phase} is before phase ${PHASES[now.phase]} on day ${now.day}, which a route has ${when}; the engine ignores it with an ERROR`)
  const check = (where: string, list: readonly Effect[], from: Pos): Pos => {
    let now = from
    for (const e of list) {
      const t = timeOf(e)
      if (t === undefined) continue
      const m = move(now, t)
      if (m.back !== undefined) hint(where, t, now, m.back, 'reached by here')
      now = m.to
    }
    return now
  }
  for (const scene of Object.values(story.scenes)) {
    const into = arrived.get(scene.id)
    if (into === undefined) continue
    const base = check(`${scene.id} on`, scene.on ?? [], into) // `on` runs first; every way out then starts from there
    const latest = routesOf(scene).reduce((m, r) => later(m, check(r.where, r.list, base)), base)
    if (scene.time !== undefined) {
      const m = move(latest, scene.time)
      if (m.back !== undefined) hint(scene.id, scene.time, latest, m.back, 'reached when the player leaves')
    }
  }
}
