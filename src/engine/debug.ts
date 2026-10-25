// engine/debug.ts — DEBUG_* actions (debug build only; the UI drops them otherwise): jump to a scene, set a value, steer the next d6. Each logs a DEBUG line, so a report shows the run was edited.
import { clamp, DAY_RANGE, HONOR_RANGE, RES_RANGE, STAT_RANGE } from './bounds'
import { changeChapter, enter } from './flow'
import { chapterOf, findScene, isSys } from './ids'
import { line, type Applied } from './log'
import { d6, initRng } from './rng'
import type { DebugPatch, GameState, SceneId, Story } from './types'
export const ROLL_SEARCH = 4096 // how many rng states debugRoll tries (each face turns up 1 time in 6, so a miss is out of the question)
const say = (state: GameState, text: string): Applied => ({ state, log: [line('DEBUG', text)] })
// Enters any scene of the story, through the same `enter` as play (its `on` effects run). History is not touched, so a replay of an edited run fails and the save falls back to the snapshot.
export function debugJump(state: GameState, scene: SceneId, story: Story): Applied {
  if (findScene(story, scene) === undefined) return say(state, `refused jump: no scene ${scene}`)
  const log = [line('DEBUG', `jump ${state.scene} -> ${scene}`)]
  let s: GameState = { ...state, resume: null }
  if (!isSys(scene) && chapterOf(scene) !== s.chapter) {
    const c = changeChapter(s, chapterOf(scene), story.social)
    s = c.state
    log.push(...c.log)
  }
  const r = enter(s, scene, story)
  return { state: r.state, log: [...log, ...r.log] }
}
// Sets one value to an exact number (rounded, clamped to its range) or switches one flag. Bad input is refused with a DEBUG line, never thrown.
export function debugSet(state: GameState, p: DebugPatch): Applied {
  if (p.kind === 'flag') {
    const key = p.key.trim()
    if (key === '') return say(state, 'refused flag: empty name')
    const flags = { ...state.flags }
    if (p.on) flags[key] = true
    else delete flags[key]
    return { state: { ...state, flags }, log: [line('DEBUG', `flag ${key} ${p.on ? 'on' : 'off'}`)] }
  }
  if (!Number.isFinite(p.value)) return say(state, `refused ${p.kind}: ${String(p.value)} is not a number`)
  const v = Math.round(p.value) + 0 // + 0 turns -0 into 0
  switch (p.kind) {
    case 'stat': {
      const n = clamp(v, STAT_RANGE[p.key])
      return say({ ...state, stats: { ...state.stats, [p.key]: n } }, `stat ${p.key} = ${n}`)
    }
    case 'res': {
      const n = clamp(v, RES_RANGE)
      return say({ ...state, res: { ...state.res, [p.key]: n } }, `res ${p.key} = ${n}`)
    }
    case 'honor': {
      const n = clamp(v, HONOR_RANGE)
      return say({ ...state, honor: n }, `honor = ${n}`)
    }
    case 'day': {
      const n = clamp(v, DAY_RANGE)
      return say({ ...state, day: n }, `day = ${n}`)
    }
    case 'rng': return say({ ...state, rng: initRng(v) }, `rng reseeded with ${v}`)
  }
}
// An rng state whose next d6 is `roll`, found by scanning from the current state; undefined for anything but 1-6.
export function rngForRoll(rng: number, roll: number, tries: number = ROLL_SEARCH): number | undefined {
  for (let k = 0; k < tries; k++) {
    const candidate = (rng + k) | 0
    if (d6(candidate).value === roll) return candidate
  }
  return undefined
}
export function debugRoll(state: GameState, roll: number): Applied {
  const rng = Number.isInteger(roll) ? rngForRoll(state.rng, roll) : undefined
  if (rng === undefined) return say(state, `refused roll: ${String(roll)} is not a d6 face (1-6)`)
  return say({ ...state, rng }, `next d6 will be ${roll}`)
}
