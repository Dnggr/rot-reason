// scripts/lintTone.ts — tone checks. In-world nobody knows "zombie" (D23): error. Story first (D22): a chapter of 8+ scenes needs 85% scenes without a choice: warning.
import { isSys } from '../src/engine/ids'
import type { Scene, Story } from '../src/engine/types'
export const OUT_OF_WORLD = /\b(zombies?|undead)\b/i
export const STORY_SHARE = 85 // percent of a chapter's scenes that carry no choice
export const MIN_SCENES = 8 // shorter chapters are too small to pace
const chapterOf = (id: string): string => id.slice(0, id.indexOf('.'))
const textsOf = (s: Scene): string[] => [
  ...(typeof s.text === 'string' ? [s.text] : s.text.map((b) => (typeof b === 'string' ? b : b.text))),
  ...(s.glitch === undefined ? [] : [s.glitch]),
  ...(s.choices ?? []).map((c) => c.text),
]
// Per chapter: how many scenes there are and how many of them ask the player to choose.
export function paceOf(scenes: readonly Scene[]): Record<string, { scenes: number; game: number }> {
  const out: Record<string, { scenes: number; game: number }> = {}
  for (const s of scenes) {
    const c = (out[chapterOf(s.id)] ??= { scenes: 0, game: 0 })
    c.scenes += 1
    if (s.choices !== undefined) c.game += 1
  }
  return out
}
export function lintTone(story: Story, errors: string[], warnings: string[]): void {
  const scenes = Object.values(story.scenes).filter((s) => !isSys(s.id))
  for (const s of scenes) {
    const hit = textsOf(s).map((t) => OUT_OF_WORLD.exec(t)?.[0]).find((m) => m !== undefined)
    if (hit !== undefined) errors.push(`${s.id}: in-world text says "${hit}" - nobody in Marrow Bay knows that word (D23)`)
  }
  for (const [chapter, p] of Object.entries(paceOf(scenes))) {
    if (p.scenes >= MIN_SCENES && p.game * 100 > p.scenes * (100 - STORY_SHARE)) {
      warnings.push(`chapter ${chapter}: ${p.game} of ${p.scenes} scenes ask for a choice (${Math.round(((p.scenes - p.game) * 100) / p.scenes)}% story, target ${STORY_SHARE}%) (D22)`)
    }
  }
}