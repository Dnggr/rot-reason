// tests/engine/reducerHelpers.ts — shared helpers for the reducer tests: start, run a list of actions, pick a choice, list ERROR logs
import { reduce } from '../../src/engine/reducer'
import type { Action, GameState, Story } from '../../src/engine/types'
import { makeState } from './fixtures'
export const start = (story: Story): GameState => reduce(makeState(), { type: 'START', bg: 'dockworker', name: 'Ash', seed: 3 }, story)
export const run = (story: Story, ...actions: Action[]): GameState => actions.reduce((s, a) => reduce(s, a, story), start(story))
export const pick = (choice: 'a' | 'b' | 'c' | 'd'): Action => ({ type: 'CHOOSE', choice })
export const errors = (s: GameState): string[] => s.log.filter((e) => e.kind === 'ERROR').map((e) => e.text)