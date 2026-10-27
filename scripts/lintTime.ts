// scripts/lintTime.ts — warns when a `time` day is earlier than a day some route has already reached: the engine ignores it with an ERROR (M3 s6, D34). A hint from the story graph, not a proof.
import { RESUME, SYS_SCENES } from '../src/engine/ids'
import type { Effect, Scene, Story } from '../src/engine/types'
import { echoTargetsOf } from './lintWalk'
const dayOf = (e: Effect): number | undefined => (e[0] === 'time' ? e[1].day : undefined)
const highest = (days: readonly (number | undefined)[], from: number): number => days.reduce<number>((m, d) => Math.max(m, d ?? 0), from)
interface Route { to: string; list: readonly Effect[]; where: string } // one way out of a scene: where it goes and the effects that run on the way (a choice's fx, then its check branch's)
function routesOf(s: Scene): Route[] {
  const out: Route[] = (s.choices ?? []).flatMap((c) => {
    const own = c.fx ?? []
    if (c.check === undefined) return c.to === undefined ? [] : [{ to: c.to, list: own, where: `${s.id}:${c.id}` }]
    return [{ to: c.check.pass.to, list: [...own, ...(c.check.pass.fx ?? [])], where: `${s.id}:${c.id} pass` }, { to: c.check.fail.to, list: [...own, ...(c.check.fail.fx ?? [])], where: `${s.id}:${c.id} fail` }]
  })
  return s.next === undefined ? out : [...out, { to: s.next, list: [], where: s.id }]
}
// The latest day any route can have reached when it enters each scene (day 1 at the start); days only grow, so this settles.
function arrival(story: Story): Map<string, number> {
  const day = new Map<string, number>([[story.start, 1]])
  const push = (to: string, d: number): boolean => {
    if (to === RESUME || SYS_SCENES.includes(to) || (day.get(to) ?? 0) >= d) return false
    day.set(to, d)
    return true
  }
  for (let grew = true; grew; ) {
    grew = false
    for (const [id, into] of [...day]) {
      const s = Object.hasOwn(story.scenes, id) ? story.scenes[id] : undefined
      if (s === undefined) continue
      const base = highest((s.on ?? []).map(dayOf), into)
      for (const r of routesOf(s)) grew = push(r.to, highest([...r.list.map(dayOf), s.time?.day], base)) || grew
      for (const t of echoTargetsOf(s)) grew = push(t, base) || grew // an echo comes back later, so this is the least it can be
    }
  }
  return day
}
export function lintTime(story: Story, warnings: string[]): void {
  const arrived = arrival(story)
  const check = (where: string, list: readonly Effect[], from: number): number => {
    let now = from
    for (const e of list) {
      const d = dayOf(e)
      if (d !== undefined && d < now) warnings.push(`${where}: time day ${d} is before day ${now}, which a route has reached by here; the engine ignores it with an ERROR`)
      now = highest([d], now)
    }
    return now
  }
  for (const scene of Object.values(story.scenes)) {
    const into = arrived.get(scene.id)
    if (into === undefined) continue
    const base = check(`${scene.id} on`, scene.on ?? [], into) // `on` runs first; every way out then starts from there
    const latest = routesOf(scene).reduce((m, r) => Math.max(m, check(r.where, r.list, base)), base)
    if (scene.time?.day !== undefined && scene.time.day < latest) warnings.push(`${scene.id}: time day ${scene.time.day} is before day ${latest}, which a route has reached when the player leaves; the engine ignores it with an ERROR`)
  }
}
