// scripts/lintWalk.ts — helpers that list every effect, condition and exit of a scene (used by the lint checks)
import type { Condition, Effect, Scene } from '../src/engine/types'
// Every effect a scene can apply: `on`, choice fx, check branch fx, and a choice's `echo` as an ['echo', spec] effect.
export function effectsOf(scene: Scene): Effect[] {
  const out: Effect[] = [...(scene.on ?? [])]
  for (const c of scene.choices ?? []) {
    out.push(...(c.fx ?? []), ...(c.check?.pass.fx ?? []), ...(c.check?.fail.fx ?? []))
    if (c.echo !== undefined) out.push(['echo', c.echo])
  }
  return out
}
// Each effect list a scene runs in one go, in order: `on`, and per choice its fx followed by each check branch's fx (what `applyAll` sees).
export function effectListsOf(scene: Scene): { where: string; list: Effect[] }[] {
  const lists = [{ where: `${scene.id} on`, list: [...(scene.on ?? [])] }]
  for (const c of scene.choices ?? []) {
    const own = c.fx ?? []
    if (c.check === undefined) lists.push({ where: `${scene.id}:${c.id}`, list: [...own] })
    else {
      lists.push({ where: `${scene.id}:${c.id} pass`, list: [...own, ...(c.check.pass.fx ?? [])] })
      lists.push({ where: `${scene.id}:${c.id} fail`, list: [...own, ...(c.check.fail.fx ?? [])] })
    }
  }
  return lists
}
export function flatten(c: Condition): Condition[] {
  if ('all' in c) return [c, ...c.all.flatMap(flatten)]
  if ('any' in c) return [c, ...c.any.flatMap(flatten)]
  if ('not' in c) return [c, ...flatten(c.not)]
  return [c]
}
// Every condition tuple in a scene: beat conditions, choice `if` and `lock`.
export function conditionsOf(scene: Scene): Condition[] {
  const beats = typeof scene.text === 'string' ? [] : scene.text.flatMap((b) => (typeof b === 'string' || b.if === undefined ? [] : [b.if]))
  const choices = (scene.choices ?? []).flatMap((c) => [c.if, c.lock].filter((x): x is Condition => x !== undefined))
  return [...beats, ...choices].flatMap(flatten)
}
// Every character that speaks a line in a scene (`say` beats).
export const speakersOf = (scene: Scene): string[] => (typeof scene.text === 'string' ? [] : scene.text.flatMap((b) => (typeof b !== 'string' && 'say' in b ? [b.say] : [])))
// Where a scene can go next: choice targets, check branch targets, `next`.
export function exitsOf(scene: Scene): string[] {
  const out = (scene.choices ?? []).flatMap((c) => (c.check ? [c.check.pass.to, c.check.fail.to] : c.to === undefined ? [] : [c.to]))
  return scene.next === undefined ? out : [...out, scene.next]
}
// Scenes this scene schedules as echoes.
export const echoTargetsOf = (scene: Scene): string[] => effectsOf(scene).flatMap((e) => (e[0] === 'echo' ? [e[1].scene] : []))
export function wordCount(scene: Scene): number {
  const parts = typeof scene.text === 'string' ? [scene.text] : scene.text.map((b) => (typeof b === 'string' ? b : b.text))
  return parts.join(' ').trim().split(/\s+/).length
}
