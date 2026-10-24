// engine/select.ts — currentView(state, story): everything the UI renders for the current scene; hudOf(state): the vitals (the UI never reads story data)
import { checkOdds, type Odds } from './checks'
import { status } from './choices'
import { evaluate } from './conditions'
import { AUTO_ENDING, resolveEnding } from './endings'
import { tierOf } from './honor'
import { findScene } from './ids'
import type { ChoiceId, Condition, GameState, Mood, Phase, ResKey, Scene, SceneId, StatKey, Story, Tier, Tone } from './types'
export const GLITCH_BELOW = 30 // reason under this shows a scene's `glitch` text instead of its text
export interface ChoiceView {
  id: ChoiceId
  text: string
  tone: Tone | undefined
  cost: Partial<Record<ResKey, number>> | undefined
  enabled: boolean
  why: 'lock' | 'cost' | undefined // why a disabled choice is disabled
  lock: Condition | undefined // the condition behind a locked choice; the UI words it (ui/lockReason.ts, D20)
  odds: Odds | undefined // checks only
}
export interface BeatView {
  text: string
  say: string | undefined // the character speaking this line; undefined = narration
}
export interface View {
  kind: 'choices' | 'next' | 'end' | 'error' // error = the scene does not exist: show the fallback screen
  scene: SceneId
  lines: string[] // the text of every beat, in order (narration and speech)
  beats: BeatView[] // the same lines with their speaker, for the stage (ui/turns.ts)
  who: string[]
  place: string | undefined
  mood: Mood | undefined
  choices: ChoiceView[]
  ending: string | undefined
}
function beatsOf(scene: Scene, s: GameState): BeatView[] {
  if (scene.glitch !== undefined && s.stats.reason < GLITCH_BELOW) return [{ text: scene.glitch, say: undefined }]
  const beats = typeof scene.text === 'string' ? [scene.text] : scene.text
  return beats.flatMap((b): BeatView[] => {
    if (typeof b === 'string') return [{ text: b, say: undefined }]
    if (b.if !== undefined && !evaluate(b.if, s)) return []
    return [{ text: b.text, say: 'say' in b ? b.say : undefined }]
  })
}
export function currentView(state: GameState, story: Story): View {
  const scene = findScene(story, state.scene)
  if (scene === undefined) return { kind: 'error', scene: state.scene, lines: [], beats: [], who: [], place: undefined, mood: undefined, choices: [], ending: undefined }
  const choices: ChoiceView[] = (scene.choices ?? []).flatMap((c) => {
    const st = status(c, state)
    if (st === 'hidden') return []
    const odds = c.check === undefined ? undefined : checkOdds(c.check.attr, c.check.dc, state, story.traitBonus)
    return [{ id: c.id, text: c.text, tone: c.tone, cost: c.cost, enabled: st === 'open', why: st === 'locked' ? 'lock' : st === 'broke' ? 'cost' : undefined, lock: st === 'locked' ? c.lock : undefined, odds }]
  })
  const kind = scene.choices !== undefined ? 'choices' : scene.next !== undefined ? 'next' : scene.end !== undefined ? 'end' : 'error'
  const ending = scene.end === undefined ? undefined : scene.end === AUTO_ENDING ? resolveEnding(state, story.endings) : scene.end
  const beats = beatsOf(scene, state)
  return { kind, scene: scene.id, lines: beats.map((b) => b.text), beats, who: [...(scene.who ?? [])], place: scene.place, mood: scene.mood, choices, ending }
}
export interface Hud {
  name: string
  day: number
  phase: Phase
  stats: Record<StatKey, number>
  res: Record<ResKey, number>
  honor: number
  tier: Tier
}
export const hudOf = (s: GameState): Hud => ({ name: s.name, day: s.day, phase: s.phase, stats: { ...s.stats }, res: { ...s.res }, honor: s.honor, tier: tierOf(s.honor) })
