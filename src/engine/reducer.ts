// engine/reducer.ts — reduce(state, action, story): the only state-changing path (ARCHITECTURE §4, §5); never throws
import { choose, proceed } from './choose'
import { startGame } from './init'
import { SYS_ERROR } from './ids'
import { line, pushLog, type Applied } from './log'
import { validState } from './stateSchema'
import type { Action, GameState, Story } from './types'
function step(state: GameState, action: Action, story: Story): Applied {
  switch (action.type) {
    case 'START': return startGame(story, action.bg, action.name, action.seed)
    case 'CHOOSE': return choose(state, action.choice, story)
    case 'CONTINUE': return proceed(state, story)
    case 'CAMP': return { state, log: [line('ERROR', `ignored: CAMP ${action.action} is not implemented yet`)] } // camp hub: M4
    case 'LOAD': {
      const snapshot = validState(action.save.snapshot, story)
      if (snapshot === undefined) return { state, log: [line('ERROR', 'ignored: LOAD snapshot is not a valid state for this story')] }
      return { state: snapshot, log: [line('FX', `loaded ${snapshot.scene}`)] }
    }
  }
}
// A thrown error (for example a NaN reaching bounds.clamp) becomes an ERROR log line and the sys.error scene, never a blank screen.
export function reduce(state: GameState, action: Action, story: Story): GameState {
  try {
    const r = step(state, action, story)
    return pushLog(r.state, r.log)
  } catch (e) {
    const text = e instanceof Error ? e.message : String(e)
    return pushLog({ ...state, scene: SYS_ERROR }, [line('ERROR', `reducer threw on ${action.type}: ${text}`)])
  }
}
