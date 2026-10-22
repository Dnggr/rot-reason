// engine/select.ts — currentView(state, story): everything the UI renders for the current scene (the UI never reads story data)
import { checkOdds, type Odds } from './checks'
import { status } from './choices'
import { evaluate } from './conditions'
import { AUTO_ENDING, resolveEnding } from './endings'
import { findScene } from './ids'
import type { ChoiceId, GameState, Mood, ResKey, Scene, SceneId, Story, Tone } from './types'
export const GLITCH_BELOW = 30 // reason under this shows a scene's `glitch` text instead of its text
export interface ChoiceView {
  id: ChoiceId
  text: string
  tone: Tone | undefined
  cost: Partial<Record<ResKey, number>> | undefined
  enabled: boolean
  why: 'lock' | 'cost' | undefined // why a disabled choice is disabled
  odds: Odds | undefined // checks only
}
export interface View {
  kind: 'choices' | 'next' | 'end' | 'error' // error = the scene does not exist: show the fallback screen
  scene: SceneId
  lines: string[]
  who: string[]
  place: string | undefined
  mood: Mood | undefined
  choices: ChoiceView[]
  ending: string | undefined
}
function linesOf(scene: Scene, s: GameState): string[] {
  if (scene.glitch !== undefined && s.stats.reason < GLITCH_BELOW) return [scene.glitch]
  const beats = typeof scene.text === 'string' ? [scene.text] : scene.text
  return beats.flatMap((b) => (typeof b === 'string' ? [b] : evaluate(b.if, s) ? [b.text] : []))
}
export function currentView(state: GameState, story: Story): View {
  const scene = findScene(story, state.scene)
  if (scene === undefined) return { kind: 'error', scene: state.scene, lines: [], who: [], place: undefined, mood: undefined, choices: [], ending: undefined }
  const choices: ChoiceView[] = (scene.choices ?? []).flatMap((c) => {
    const st = status(c, state)
    if (st === 'hidden') return []
    const odds = c.check === undefined ? undefined : checkOdds(c.check.attr, c.check.dc, state, story.traitBonus)
    return [{ id: c.id, text: c.text, tone: c.tone, cost: c.cost, enabled: st === 'open', why: st === 'locked' ? 'lock' : st === 'broke' ? 'cost' : undefined, odds }]
  })
  const kind = scene.choices !== undefined ? 'choices' : scene.next !== undefined ? 'next' : scene.end !== undefined ? 'end' : 'error'
  const ending = scene.end === undefined ? undefined : scene.end === AUTO_ENDING ? resolveEnding(state, story.endings) : scene.end
  return { kind, scene: scene.id, lines: linesOf(scene, state), who: [...(scene.who ?? [])], place: scene.place, mood: scene.mood, choices, ending }
}
