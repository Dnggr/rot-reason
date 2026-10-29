// engine/choose.ts — CHOOSE and CONTINUE: validate the click, then tick, cost, check, effects, cap, time, advance (ARCHITECTURE §4)
import { status, RES_KEYS } from './choices'
import { schedule, tick } from './echoes'
import { apply, applyAll } from './effects'
import { advance } from './flow'
import { capScene } from './honor'
import { findScene, SYS_MISSING } from './ids'
import { line, type Applied, type LogLine } from './log'
import { resolveCheck } from './checks'
import type { ChoiceId, Effect, GameState, Scene, SceneId, Story } from './types'
export const CONTINUE_TOKEN = '>' // history entry of a CONTINUE: "scene:>"
const stale = (state: GameState, text: string): Applied => ({ state, log: [line('ERROR', `ignored: ${text}`)] })
// Time passes when the player leaves the scene; the history entry is what replay uses.
function leave(s: GameState, scene: Scene, token: string, to: SceneId, story: Story, log: LogLine[]): Applied {
  let cur = s
  if (scene.time !== undefined) {
    const t = apply(['time', scene.time], cur, story.deeds)
    cur = t.state
    log.push(...t.log)
  }
  const a = advance({ ...cur, history: [...cur.history, `${scene.id}:${token}`] }, to, story, scene)
  return { state: a.state, log: [...log, ...a.log] }
}
export function choose(state: GameState, id: ChoiceId, story: Story): Applied {
  const scene = findScene(story, state.scene)
  const choice = scene?.choices?.find((c) => c.id === id)
  if (scene === undefined || choice === undefined) return stale(state, `no choice ${id} in ${state.scene}`)
  const st = status(choice, state)
  if (st !== 'open') return stale(state, `choice ${id} in ${scene.id} is ${st}`)
  const before = state.honor
  const log: LogLine[] = [line('CHOICE', `${scene.id}:${id}`)]
  let s = tick(state)
  for (const k of RES_KEYS) {
    const n = choice.cost?.[k] ?? 0
    if (n > 0) {
      const r = apply(['res', k, -n], s, story.deeds)
      s = r.state
      log.push(...r.log)
    }
  }
  let list: readonly Effect[] = choice.fx ?? []
  let to = choice.to
  if (choice.check !== undefined) {
    const r = resolveCheck(choice.check.attr, choice.check.dc, s, story.traitBonus, story.perks)
    const branch = r.pass ? choice.check.pass : choice.check.fail
    s = r.state
    log.push(...r.log)
    list = [...list, ...(branch.fx ?? [])]
    to = branch.to
  }
  const fx = applyAll(list, s, story.deeds, story.social)
  s = fx.state
  log.push(...fx.log)
  if (choice.echo !== undefined) {
    const e = schedule(s, choice.echo)
    s = e.state
    log.push(...e.log)
  }
  const cap = capScene(before, s, state.deeds) // the deeds this pick added give back what the cap took (D31)
  log.push(...cap.log)
  if (to === undefined) log.push(line('ERROR', `choice ${id} in ${scene.id} has no target`))
  return leave(cap.state, scene, id, to ?? SYS_MISSING, story, log)
}
export function proceed(state: GameState, story: Story): Applied {
  const scene = findScene(story, state.scene)
  if (scene?.next === undefined) return stale(state, `scene ${state.scene} has no next`)
  return leave(tick(state), scene, CONTINUE_TOKEN, scene.next, story, [])
}