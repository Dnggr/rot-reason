// scripts/lintGraph.ts — graph checks: missing targets, unreachable scenes, no path to an ending, $resume rules, echo targets tagged 'echo', no plain exit into an echo scene, ending ids, system scenes
import { endingIds } from '../src/engine/endings'
import { RESUME, SYS_SCENES, isSys } from '../src/engine/ids'
import type { Scene, Story } from '../src/engine/types'
import { echoTargetsOf, exitsOf } from './lintWalk'
export function lintGraph(story: Story, errors: string[]): void {
  const scenes = Object.values(story.scenes)
  const has = (id: string): boolean => Object.hasOwn(story.scenes, id)
  const edges = (s: Scene): string[] => [...exitsOf(s), ...echoTargetsOf(s)].filter((t) => t !== RESUME)
  if (!has(story.start)) errors.push(`start scene ${story.start} does not exist`)
  else if (story.scenes[story.start]?.tags?.includes('echo') === true) errors.push(`start scene ${story.start} is an echo scene; an echo scene is reached by an 'echo' effect only`)
  for (const id of SYS_SCENES) if (!has(id)) errors.push(`system scene ${id} is missing`)
  const known = endingIds(story.endings)
  for (const s of scenes) {
    for (const t of [...exitsOf(s), ...echoTargetsOf(s)]) if (t !== RESUME && !has(t)) errors.push(`${s.id}: target ${t} does not exist`)
    for (const t of echoTargetsOf(s)) if (has(t) && story.scenes[t]?.tags?.includes('echo') !== true) errors.push(`${s.id}: echo target ${t} must be tagged 'echo' (an untagged echo scene drops the player's destination, STORY_FORMAT §5)`)
    for (const t of exitsOf(s)) if (t !== RESUME && story.scenes[t]?.tags?.includes('echo') === true) errors.push(`${s.id}: exit to ${t} is an echo scene; an echo scene is reached by an 'echo' effect only (a plain exit leaves $resume with nothing pending and lands on sys.missing)`)
    if (s.end !== undefined && !known.includes(s.end)) errors.push(`${s.id}: unknown ending ${s.end}`)
    const resumes = exitsOf(s).includes(RESUME)
    const isEcho = s.tags?.includes('echo') === true
    if (resumes && !isEcho) errors.push(`${s.id}: ${RESUME} is only for scenes tagged 'echo'`)
    if (isEcho && exitsOf(s).some((t) => t !== RESUME)) errors.push(`${s.id}: an echo scene must exit with ${RESUME} only`)
  }
  const seen = new Set<string>([story.start, ...SYS_SCENES])
  const queue = [...seen]
  for (let id = queue.pop(); id !== undefined; id = queue.pop()) {
    const scene = Object.hasOwn(story.scenes, id) ? story.scenes[id] : undefined
    for (const t of scene === undefined ? [] : edges(scene)) {
      if (!seen.has(t)) {
        seen.add(t)
        queue.push(t)
      }
    }
  }
  for (const s of scenes) if (!seen.has(s.id)) errors.push(`${s.id}: unreachable from ${story.start}`)
  // Every reachable scene must be able to reach an ending ($resume counts: the scene it resumes can end).
  const done = new Set<string>(scenes.filter((s) => s.end !== undefined || exitsOf(s).includes(RESUME)).map((s) => s.id))
  for (let grew = true; grew; ) {
    grew = false
    for (const s of scenes) {
      if (!done.has(s.id) && edges(s).some((t) => done.has(t))) {
        done.add(s.id)
        grew = true
      }
    }
  }
  for (const s of scenes) if (seen.has(s.id) && !isSys(s.id) && !done.has(s.id)) errors.push(`${s.id}: no path to any ending (loop or dead end)`)
  const last = story.endings[story.endings.length - 1]
  if (last === undefined || last.if !== undefined) errors.push('the last ending rule must have no condition (the default)')
  for (const id of SYS_SCENES) if (has(id) && story.scenes[id]?.end === undefined) errors.push(`${id}: system scenes must be end scenes`)
}