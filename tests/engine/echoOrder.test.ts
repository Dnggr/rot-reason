// tests/engine/echoOrder.test.ts — M3 s7 review bugs closed in D36: `after` counts the same for an `on` echo and a choice `echo`, an echo `after` is capped, glitch text hides its speakers from `met`
import { describe, expect, it } from 'vitest'
import { ENTRY_LEAD, schedule } from '../../src/engine/echoes'
import { ECHO_AFTER_MAX } from '../../src/engine/bounds'
import { reduce } from '../../src/engine/reducer'
import { effectSchema } from '../../src/engine/schema'
import { metIn } from '../../src/engine/met'
import { stateProblem } from '../../src/engine/stateSchema'
import type { Action, GameState, Scene, Story } from '../../src/engine/types'
import { makeState } from './fixtures'
import { pick, run, start } from './reducerHelpers'
import { makeStory } from './storyFixture'
const echo: Scene = { id: 'c1.e', tags: ['echo'], text: 'echo', next: '$resume' }
const tail: Scene[] = [{ id: 'c1.b', text: 'b', next: 'c1.c' }, { id: 'c1.c', text: 'c', next: 'c1.d' }, { id: 'c1.d', text: 'd', end: 'plain' }, echo]
// the scenes a player sees, from the start, after the given actions and then Continue until c1.d
const route = (story: Story, first: Action[]): string[] => {
  const seen = [start(story).scene]
  let s: GameState = run(story, ...first)
  if (first.length > 0) seen.push(s.scene)
  for (let i = 0; i < 6 && s.scene !== 'c1.d'; i++) {
    s = reduce(s, { type: 'CONTINUE' }, story)
    seen.push(s.scene)
  }
  return seen
}
describe('echo `after` means the same for `on` and a choice `echo`', () => {
  const spec = { scene: 'c1.e', after: 1 }
  const viaOn = makeStory([{ id: 'c1.a', text: 'a', on: [['echo', spec]], next: 'c1.b' }, ...tail])
  const viaChoice = makeStory([{ id: 'c1.a', text: 'a', choices: [{ id: 'a', text: 'Go.', echo: spec, to: 'c1.b' }] }, ...tail])
  const viaFx = makeStory([{ id: 'c1.a', text: 'a', choices: [{ id: 'a', text: 'Go.', fx: [['echo', spec]], to: 'c1.b' }] }, ...tail])
  it('after: 1 lets one scene play, then the echo, then the rest (all three spellings)', () => {
    const want = ['c1.a', 'c1.b', 'c1.e', 'c1.c', 'c1.d']
    expect(route(viaOn, [])).toEqual(want)
    expect(route(viaChoice, [pick('a')])).toEqual(want)
    expect(route(viaFx, [pick('a')])).toEqual(want)
  })
  it('an `on` echo entered through a choice counts the same way', () => {
    const viaTarget = makeStory([{ id: 'c1.z', text: 'z', choices: [{ id: 'a', text: 'Go.', to: 'c1.a' }] }, { id: 'c1.a', text: 'a', on: [['echo', spec]], next: 'c1.b' }, ...tail])
    expect(route(viaTarget, [pick('a')])).toEqual(['c1.z', 'c1.a', 'c1.b', 'c1.e', 'c1.c', 'c1.d'])
  })
  it('a lead adds steps to the countdown of `after` only, and the log shows the authored `after` (M3 s9)', () => {
    const s = makeState()
    const a = schedule(s, { scene: 'x', after: 2 }, ENTRY_LEAD)
    expect(a.state.echoes).toEqual([{ scene: 'x', dueIn: 3 }])
    expect(a.log.map((l) => l.text)).toEqual(['x in 2 (on entry)'])
    expect(schedule(s, { scene: 'y', at: 'c4' }, ENTRY_LEAD).state.echoes).toEqual([{ scene: 'y', atChapter: 'c4' }])
    expect(schedule(s, { scene: 'x', after: 2 }).log.map((l) => l.text)).toEqual(['x in 2']) // a choice echo has no lead and no suffix
  })
  it('an `on` echo logs the authored `after`, not the shifted countdown, when a scene is entered', () => {
    const story = makeStory([{ id: 'c1.a', text: 'a', on: [['echo', spec]], next: 'c1.b' }, ...tail])
    expect(start(story).log.some((l) => l.text === 'c1.e in 1 (on entry)')).toBe(true)
    expect(start(story).echoes).toEqual([{ scene: 'c1.e', dueIn: 2 }])
  })
  it('the dedupe compares the real countdown: the same moment is one echo, a different one stacks', () => {
    const planted = (first: number, second: number) => run(makeStory([{ id: 'c1.a', text: 'a', choices: [{ id: 'a', text: 'Go.', echo: { scene: 'c1.e', after: first }, to: 'c1.f' }] }, { id: 'c1.f', text: 'f', on: [['echo', { scene: 'c1.e', after: second }]], next: 'c1.d' }, { id: 'c1.d', text: 'd', end: 'plain' }, echo]), pick('a')).echoes.map((e) => e.dueIn)
    expect(planted(2, 1)).toEqual([2]) // `on` after 1 = countdown 2 = the same moment as the choice echo
    expect(planted(3, 1)).toEqual([3, 2])
  })
})
describe('echo `after` cap', () => {
  it('the schema refuses an `after` above the cap and accepts the cap', () => {
    expect(effectSchema.safeParse(['echo', { scene: 'c1.e', after: ECHO_AFTER_MAX + 1 }]).success).toBe(false)
    expect(effectSchema.safeParse(['echo', { scene: 'c1.e', after: 5000 }]).success).toBe(false)
    expect(effectSchema.safeParse(['echo', { scene: 'c1.e', after: ECHO_AFTER_MAX }]).success).toBe(true)
  })
  it('an `on` echo at the cap still gives a state that passes its own schema', () => {
    const story = makeStory([{ id: 'c1.a', text: 'a', on: [['echo', { scene: 'c1.e', after: ECHO_AFTER_MAX }]], next: 'c1.d' }, { id: 'c1.d', text: 'd', end: 'plain' }, echo])
    expect(stateProblem(start(story), story)).toBeUndefined()
  })
})
describe('glitch text and the met list', () => {
  const scene: Scene = { id: 'c1.a', text: ['Rain.', { say: 'nora', text: '"Hi."' }], glitch: 'Static.', who: ['brick'], next: 'c1.d' }
  it('while the glitch shows, only `who` is met; otherwise the speakers count too', () => {
    expect(metIn(scene, makeState({ stats: { hp: 5, reason: 10, rot: 0 } }))).toEqual(['brick'])
    expect(metIn(scene, makeState({ stats: { hp: 5, reason: 30, rot: 0 } }))).toEqual(['brick', 'nora'])
  })
  it('a scene with no glitch text is unchanged at low Reason', () => {
    expect(metIn({ id: 'c1.a', text: scene.text, who: ['brick'], next: 'c1.d' }, makeState({ stats: { hp: 5, reason: 10, rot: 0 } }))).toEqual(['brick', 'nora'])
  })
})
