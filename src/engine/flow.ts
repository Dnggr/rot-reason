// engine/flow.ts — scene transitions: chapter change, echo take, entering a scene, death and missing-scene fallbacks (ARCHITECTURE §4)
import { clamp, FEAR_RANGE } from './bounds'
import { onEntry, take } from './echoes'
import { applyAll } from './effects'
import { capScene } from './honor'
import { chapterOf, findScene, isSys, RESUME, SYS_DEATH, SYS_MISSING } from './ids'
import { line, type Applied, type LogLine } from './log'
import { meet, metIn } from './met'
import { NO_SOCIAL, walkouts } from './relations'
import type { GameState, Scene, SceneId, Social, Story } from './types'
export const FEAR_DECAY = 5
// A new chapter: deed counts restart and the fear of every living npc fades (HONOR §3 rule 2, §6); a companion that fear was holding may now walk out (HONOR §4).
export function changeChapter(s: GameState, chapter: string, social: Social = NO_SOCIAL): Applied {
  const npc = Object.fromEntries(Object.entries(s.npc).map(([id, n]) => [id, n.alive ? { ...n, fear: clamp(n.fear - FEAR_DECAY, FEAR_RANGE) } : n])) // the dead do not change (D31)
  const out = walkouts({ ...s, chapter, deedCount: {}, npc }, social)
  return { state: out.state, log: [line('FX', `chapter ${chapter}: deed counts reset, fear -${FEAR_DECAY}`), ...out.log] }
}
// Moves into a scene: its `on` effects run under the honor scene cap; hp 0 sends the player to sys.death (death beats any ending).
export function enter(state: GameState, id: SceneId, story: Story): Applied {
  const scene = findScene(story, id)
  if (scene === undefined) {
    if (id === SYS_MISSING) throw new Error(`${SYS_MISSING} is missing from the story`)
    const r = enter(state, SYS_MISSING, story)
    return { state: r.state, log: [line('ERROR', `missing scene ${id}`), ...r.log] }
  }
  const before = state.honor
  const seen = meet({ ...state, scene: id }, metIn(scene, state)) // whoever the scene shows is met before its effects run (D31)
  const on = applyAll(onEntry(scene.on), seen, story.deeds, story.social)
  const cap = capScene(before, on.state, state.deeds)
  const log = [line('SCENE', id), ...on.log, ...cap.log]
  if (cap.state.stats.hp <= 0 && !isSys(id)) {
    const d = enter(cap.state, SYS_DEATH, story)
    return { state: d.state, log: [...log, line('FX', 'hp is 0'), ...d.log] }
  }
  return { state: cap.state, log }
}
// Leaves `from` towards `target`: resolves $resume, missing targets and death, then chapter change and a due echo (even before an ending), then enters.
export function advance(state: GameState, target: SceneId, story: Story, from: Scene): Applied {
  const log: LogLine[] = []
  let s = state
  let to = target
  if (to === RESUME) {
    if (s.resume === null) {
      log.push(line('ERROR', 'resume with nothing pending'))
      to = SYS_MISSING
    } else {
      to = s.resume
      s = { ...s, resume: null }
    }
  } else if (s.resume !== null && from.tags?.includes('echo') !== true) {
    log.push(line('ERROR', `stale resume ${s.resume} dropped`))
    s = { ...s, resume: null }
  }
  const dest = findScene(story, to)
  if (dest === undefined) {
    log.push(line('ERROR', `missing scene ${to}`))
    to = SYS_MISSING
  } else if (s.stats.hp <= 0) {
    log.push(line('FX', 'hp is 0'))
    to = SYS_DEATH
  }
  if (!isSys(to)) {
    if (chapterOf(to) !== s.chapter) {
      const c = changeChapter(s, chapterOf(to), story.social)
      s = c.state
      log.push(...c.log)
    }
    const t = take(s)
    s = t.state
    log.push(...t.log)
    if (t.scene !== undefined && findScene(story, t.scene) === undefined) log.push(line('ERROR', `echo scene ${t.scene} is missing: dropped`))
    else if (t.scene !== undefined) {
      s = { ...s, resume: s.resume ?? to }
      to = t.scene
    }
  }
  const r = enter(s, to, story)
  return { state: r.state, log: [...log, ...r.log] }
}