// scripts/fuzzRun.ts — runFuzz: random playthroughs per background; reports soft-locks, loops, invalid state, error logs, replay drift
import { endingIds, SYS_ENDING } from '../src/engine/endings'
import { startGame } from '../src/engine/init'
import { pushLog } from '../src/engine/log'
import { reduce } from '../src/engine/reducer'
import { initRng, nextInt } from '../src/engine/rng'
import { replay } from '../src/engine/save'
import { currentView } from '../src/engine/select'
import { stateProblem } from '../src/engine/stateSchema'
import type { Action, GameState, Story } from '../src/engine/types'
export const MAX_STEPS = 500
export interface Failure {
  why: string
  bg: string
  seed: number
  history: string[] // replay it: engine/save.ts replay(story, { seed, bg, name: 'Ash' }, history)
}
export interface FuzzReport {
  runs: number
  steps: number
  endings: Record<string, number>
  never: string[] // ending ids no run reached (information until M6 turns it into a gate)
  failures: Failure[]
}
interface Played {
  steps: number
  state: GameState
  ending?: string
  why?: string
}
function play(story: Story, bg: string, seed: number): Played {
  const r = startGame(story, bg, 'Ash', seed)
  let s = pushLog(r.state, r.log)
  let bot = initRng(seed ^ 0x5bd1e995)
  let seenErrors = 0
  for (let steps = 1; steps <= MAX_STEPS; steps++) {
    const bad = stateProblem(s, story) // shape, party and every id the state holds (D33)
    if (bad !== undefined) return { steps, state: s, why: `invalid state: ${bad}` }
    const errors = s.log.filter((e) => e.kind === 'ERROR')
    if (errors.length > seenErrors) return { steps, state: s, why: `ERROR log: ${errors[errors.length - 1]?.text}` }
    seenErrors = errors.length
    const v = currentView(s, story)
    if (v.kind === 'error') return { steps, state: s, why: `missing scene ${v.scene}` }
    if (v.kind === 'end') return v.ending === undefined || v.ending === SYS_ENDING ? { steps, state: s, why: `fallback ending at ${v.scene}` } : { steps, state: s, ending: v.ending }
    let action: Action = { type: 'CONTINUE' }
    if (v.kind === 'choices') {
      const open = v.choices.filter((c) => c.enabled)
      if (open.length === 0) return { steps, state: s, why: `soft-lock: no enabled choice at ${v.scene}` }
      const pick = nextInt(bot, 0, open.length - 1)
      bot = pick.rng
      action = { type: 'CHOOSE', choice: open[pick.value]?.id ?? 'a' }
    }
    s = reduce(s, action, story)
  }
  return { steps: MAX_STEPS, state: s, why: `loop: more than ${MAX_STEPS} steps` }
}
// Same seed + history must rebuild the same game (M1 definition of done).
function replayDrift(story: Story, bg: string, seed: number, end: GameState): string | undefined {
  const re = replay(story, { seed, bg, name: 'Ash' }, end.history)
  if ('error' in re) return `replay failed: ${re.error}`
  return JSON.stringify(re.state) === JSON.stringify(end) ? undefined : 'replay differs from the live run'
}
export function runFuzz(story: Story, runs: number, seed: number): FuzzReport {
  const bgs = Object.keys(story.backgrounds)
  const report: FuzzReport = { runs, steps: 0, endings: {}, never: [], failures: [] }
  let master = initRng(seed)
  for (let i = 0; i < runs; i++) {
    const pick = nextInt(master, 0, 0x7fffffff)
    master = pick.rng
    const bg = bgs[i % bgs.length] ?? 'dockworker'
    const p = play(story, bg, pick.value)
    report.steps += p.steps
    const why = p.why ?? replayDrift(story, bg, pick.value, p.state)
    if (why !== undefined) report.failures.push({ why, bg, seed: pick.value, history: p.state.history })
    else if (p.ending !== undefined) report.endings[p.ending] = (report.endings[p.ending] ?? 0) + 1
  }
  report.never = endingIds(story.endings).filter((id) => id !== 'auto' && id !== SYS_ENDING && !Object.hasOwn(report.endings, id))
  return report
}