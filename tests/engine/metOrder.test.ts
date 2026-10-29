// tests/engine/metOrder.test.ts — M3 s8 review bug closed in M3 s9: `met` is worked out from the state after the scene's `on` effects, the state the view is read from
import { describe, expect, it } from 'vitest'
import { currentView } from '../../src/engine/select'
import type { Scene } from '../../src/engine/types'
import { start } from './reducerHelpers'
import { makeStory } from './storyFixture'
const end: Scene = { id: 'c1.z', text: 'z', end: 'plain' }
describe('met follows what the page shows after `on`', () => {
  it('an `on` that drops Reason below the glitch line: the glitch shows, nobody but `who` is met', () => {
    const story = makeStory([{ id: 'c1.b', text: ['Rain.', { say: 'nora', text: '"Hi."' }], glitch: 'Static.', on: [['stat', 'reason', -60]], next: 'c1.z' }, end])
    const s = start(story)
    expect(currentView(s, story).lines).toEqual(['Static.'])
    expect(s.met).toEqual([])
  })
  it('an `on` that sets the flag a beat reads: the speaker shows, so the speaker is met', () => {
    const story = makeStory([{ id: 'c1.b', text: ['Rain.', { if: ['flag', 'k'], say: 'nora', text: '"Hi."' }], on: [['set', 'k']], next: 'c1.z' }, end])
    const s = start(story)
    expect(currentView(s, story).beats.map((b) => b.say)).toEqual([undefined, 'nora'])
    expect(s.met).toEqual(['nora'])
  })
  it('`who` is met as before, and a scene that sends the player to death shows nobody', () => {
    const who = makeStory([{ id: 'c1.b', text: 'x', who: ['brick'], on: [['stat', 'reason', -60]], next: 'c1.z' }, end])
    expect(start(who).met).toEqual(['brick'])
    const dies = makeStory([{ id: 'c1.b', text: ['x', { say: 'nora', text: '"Hi."' }], who: ['brick'], on: [['stat', 'hp', -9]], next: 'c1.z' }, end])
    const s = start(dies)
    expect(s.scene).toBe('sys.death')
    expect(s.met).toEqual([])
  })
})
