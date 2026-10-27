// tests/engine/stateChecks.test.ts — M3 bugs closed in D32 (and the name bound, D35): a party the engine could never make is refused on load, and a revealed secret with honor owed but no deeds on record still shows in the Journal
import { describe, expect, it } from 'vitest'
import { apply } from '../../src/engine/effects'
import { journalOf } from '../../src/engine/journal'
import { reduce } from '../../src/engine/reducer'
import { gameStateSchema, saveHeadSchema, validState } from '../../src/engine/stateSchema'
import { deeds, makeState, social } from './fixtures'
import { makeStory } from './storyFixture'
const story = makeStory([{ id: 'c0.start', text: 'x', next: 'c0.start' }], { npcs: { nora: { name: 'Nora', trust: 10, fear: 0 }, brick: { name: 'Brick', trust: 0, fear: 5 }, juno: { name: 'Juno', trust: 0, fear: 0 }, hart: { name: 'Hart', trust: 0, fear: 0 } } })
const withParty = (party: string[], over: Partial<ReturnType<typeof makeState>> = {}) => ({ ...makeState({ party, met: party, ...over }), scene: 'c0.start' }) // whoever travels with you has been met (M3 s6)
const reason = (raw: unknown): string => {
  const r = gameStateSchema.safeParse(raw)
  return r.success ? '' : (r.error.issues[0]?.message ?? '')
}
describe('validState checks the party (was: accepted an impossible party)', () => {
  it('accepts the parties the engine makes: none, one, and a full one of living npcs', () => {
    for (const party of [[], ['nora'], ['nora', 'brick', 'juno']]) expect(validState(withParty(party), story)).toBeDefined()
  })
  it('refuses more than PARTY_MAX, a repeated member, an unknown id and a dead member, each with its own message', () => {
    expect(reason(withParty(['nora', 'brick', 'juno', 'hart']))).toBe('party has 4 members (max 3)')
    expect(reason(withParty(['nora', 'nora']))).toBe('party lists someone twice')
    expect(reason(withParty(['ghost']))).toBe('party member ghost is not a living npc')
    const dead = makeState().npc
    expect(reason(withParty(['nora'], { npc: { ...dead, nora: { alive: false, trust: 0, fear: 0 } } }))).toBe('party member nora is not a living npc')
    expect(validState(withParty(['ghost', 'nora', 'brick', 'juno', 'hart']), story)).toBeUndefined()
  })
})
describe('a revealed secret that owes honor but hid no deeds (a v1 save) shows in the Journal (was: no deed)', () => {
  const v1 = () => makeState({ secrets: ['x'], owed: { x: -6 }, owedTags: {}, honor: 4 })
  it('one `unknown` deed carries the honor that was paid', () => {
    const r = apply(['reveal', 'x'], v1(), deeds, social)
    expect(r.state.honor).toBe(-2)
    expect(r.state.deeds).toEqual([{ tag: 'unknown', witnessed: false, surfaced: true, day: 1, delta: -6, who: {} }])
    expect(journalOf(r.state, story).deeds[0]).toMatchObject({ tag: 'unknown', surfaced: true, delta: -6 })
  })
  it('no deed is added when nothing was owed, and none extra when the deeds are on record', () => {
    expect(apply(['reveal', 'x'], { ...v1(), owed: { x: 0 } }, deeds, social).state.deeds).toEqual([])
    const kept = apply(['reveal', 'x'], { ...v1(), owedTags: { x: ['lie'] } }, deeds, social).state.deeds
    expect(kept.map((d) => d.tag)).toEqual(['lie'])
    expect(kept[0]?.delta).toBe(-6)
  })
})
describe('a player name is 1 to 24 characters and not blank (M3 s7, D35; was: any string, even 100,000 characters)', () => {
  it('the state and the save envelope refuse an empty, a blank and an over-long name', () => {
    for (const name of ['', '   ', 'x'.repeat(25), 'x'.repeat(100_000)]) {
      expect(validState({ ...makeState({ name }), scene: 'c0.start' }, story)).toBeUndefined()
      expect(saveHeadSchema.safeParse({ v: 4, seed: 1, bg: 'dockworker', name, history: [], savedAt: 1, snapshot: null, checkpoint: null }).success).toBe(false)
    }
    for (const name of ['Ash', 'x'.repeat(24)]) expect(validState({ ...makeState({ name }), scene: 'c0.start' }, story)).toBeDefined()
  })
  it('START with a bad name is an ERROR and the error scene, not a state the save would refuse', () => {
    const s = reduce(makeState(), { type: 'START', bg: 'dockworker', name: '', seed: 1 }, story)
    expect(s.scene).toBe('sys.error')
    expect(s.log[s.log.length - 1]?.text).toContain('name must be 1 to 24 characters')
    expect(reduce(makeState(), { type: 'START', bg: 'dockworker', name: 'x'.repeat(25), seed: 1 }, story).scene).toBe('sys.error')
  })
})
