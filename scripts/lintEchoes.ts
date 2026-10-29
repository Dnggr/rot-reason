// scripts/lintEchoes.ts — warns about an echo that can never fire: an `after` longer than any route from the scheduling scene, an `at` chapter no route from it reaches (M3 s9). A hint from the story graph, not a proof.
import { chapterOf, isSys, RESUME } from '../src/engine/ids'
import type { Scene, Story } from '../src/engine/types'
import { effectListsOf, exitsOf } from './lintWalk'
// The longest walk (in transitions) from each scene along plain exits; Infinity when a loop is reachable (it can go on for ever). Echo scenes and `$resume` are not followed.
function longest(story: Story): (id: string) => number {
  const memo = new Map<string, number>()
  const visiting = new Set<string>()
  const walk = (id: string): number => {
    const known = memo.get(id)
    if (known !== undefined) return known
    const scene: Scene | undefined = Object.hasOwn(story.scenes, id) ? story.scenes[id] : undefined
    if (scene === undefined) return 0
    if (visiting.has(id)) return Infinity
    visiting.add(id)
    const best = exitsOf(scene).filter((t) => t !== RESUME).reduce((m, t) => Math.max(m, 1 + walk(t)), 0)
    visiting.delete(id)
    memo.set(id, best) // an Infinity is sound too: a back edge means a loop is reachable from every scene on the way down
    return best
  }
  return walk
}
// Every scene a player can walk to from `from` along plain exits (not `from` itself unless a loop returns to it).
function reach(story: Story, from: string): Set<string> {
  const seen = new Set<string>()
  const queue = [from]
  for (let id = queue.pop(); id !== undefined; id = queue.pop()) {
    const scene = Object.hasOwn(story.scenes, id) ? story.scenes[id] : undefined
    for (const t of scene === undefined ? [] : exitsOf(scene)) if (t !== RESUME && !seen.has(t)) { seen.add(t); queue.push(t) }
  }
  return seen
}
export function lintEchoes(story: Story, warnings: string[]): void {
  const far = longest(story)
  const out = new Set<string>()
  for (const scene of Object.values(story.scenes)) {
    if (scene.tags?.includes('echo') === true || isSys(scene.id)) continue // an echo scene resumes into a route the graph cannot see, so its echoes are not judged
    for (const { where, list } of effectListsOf(scene)) {
      for (const e of list) {
        if (e[0] !== 'echo') continue
        const { scene: target, after, at } = e[1]
        if (after !== undefined && far(scene.id) < after + 1) out.add(`${where}: echo ${target} after ${after} can never fire: the longest route from ${scene.id} has only ${far(scene.id)} more scene${far(scene.id) === 1 ? '' : 's'}, and an echo needs ${after + 1} transitions (the game ends first; a hint, not a proof)`)
        if (at !== undefined && at !== chapterOf(scene.id) && ![...reach(story, scene.id)].some((id) => chapterOf(id) === at)) out.add(`${where}: echo ${target} is due 'at' ${at}, but no route from ${scene.id} reaches a scene of ${at}, so it can never fire`)
      }
    }
  }
  warnings.push(...out)
}
