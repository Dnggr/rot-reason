// tests/engine/stateRefs.test.ts — M3 s4 bug closed in D33: a save that points at things the story does not have (scenes, bg, flags, chapter, met, owed keys, npc table) is refused on load
import { describe, expect, it } from 'vitest'
import { startGame } from '../../src/engine/init'
import { loadSave, makeSave } from '../../src/engine/save'
import { stateProblem, validState } from '../../src/engine/stateSchema'
import type { GameState } from '../../src/engine/types'
import { makeStory } from './storyFixture'
const story = makeStory(
  [
    { id: 'c1.a', text: 'a', next: 'c1.b' },
    { id: 'c1.b', text: 'b', next: 'c2.a' },
    { id: 'c2.a', text: 'c', next: 'c1.e' },
    { id: 'c1.e', text: 'an echo from chapter 1', tags: ['echo'], next: '$resume' },
  ],
  { flags: { won: 'the player won' } },
)
const base = (): GameState => startGame(story, 'dockworker', 'Ash', 3).state
const with_ = (over: Partial<GameState>): GameState => ({ ...base(), ...over })
describe('validState checks every id against the story (was: shape and party only)', () => {
  it('accepts what the engine makes: a new game, flags it registered, an echo and a held secret with owed honor', () => {
    expect(stateProblem(base(), story)).toBeUndefined()
    expect(validState(with_({ flags: { won: true }, echoes: [{ scene: 'c1.e', dueIn: 2 }], met: ['nora'], secrets: ['x'], owed: { x: -4 }, owedTags: { x: ['lie'] } }), story)).toBeDefined()
  })
  it('refuses each probe from the M3 s4 review, with its own reason', () => {
    const cases: [string, Partial<GameState>][] = [
      ['echo scene c9.zz is not in the story', { echoes: [{ scene: 'c9.zz', dueIn: 1 }] }],
      ['resume scene c9.zz is not in the story', { resume: 'c9.zz' }],
      ['background pirate is not in the story', { bg: 'pirate' }],
      ['flag ghost_flag is not in the story', { flags: { ghost_flag: true } }],
      ['chapter c2 does not match scene c1.a', { chapter: 'c2' }],
      ['met ghost is not an npc of the story', { met: ['ghost'] }],
      ['met lists nora twice', { met: ['nora', 'nora'] }],
      ['owed honor for x, a secret that is not held', { owed: { x: -4 } }],
      ['owed honor for x, a secret that is not held', { owedTags: { x: ['lie'] } }],
      ['secret x is held twice', { secrets: ['x', 'x'] }],
      ['npc table has no entry for nora', { npc: { brick: { alive: true, trust: 0, fear: 5 } } }],
      ['npc table has no entry for nora', { npc: {} }],
      ['npc ghost is not in the story', { npc: { ...base().npc, ghost: { alive: true, trust: 0, fear: 0 } } }],
    ]
    for (const [why, over] of cases) {
      expect(stateProblem(with_(over), story)).toBe(why)
      expect(validState(with_(over), story)).toBeUndefined()
    }
  })
  it('an echo scene may sit in another chapter than state.chapter; so may a sys scene; but the chapter must still exist', () => {
    expect(stateProblem(with_({ scene: 'c1.e', chapter: 'c2', resume: 'c2.a' }), story)).toBeUndefined()
    expect(stateProblem(with_({ scene: 'sys.death', chapter: 'c2' }), story)).toBeUndefined()
    expect(stateProblem(with_({ scene: 'sys.death', chapter: 'c9' }), story)).toBe('chapter c9 is not in the story')
    expect(stateProblem(with_({ scene: 'c1.e', chapter: 'c9' }), story)).toBe('chapter c9 is not in the story')
  })
  it('a snapshot with a bad reference falls back to replay, then to the checkpoint', () => {
    const good = base()
    const save = makeSave(good, null, story, 1)
    const hurt = { ...save, snapshot: { ...good, bg: 'pirate' } }
    const r = loadSave(hurt, story)
    expect(r.ok && r.via).toBe('replay')
    const bad = loadSave({ ...hurt, history: ['c1.a:zz'], checkpoint: good }, story)
    expect(bad.ok && bad.via).toBe('checkpoint')
  })
})
