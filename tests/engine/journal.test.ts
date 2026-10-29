// tests/engine/journal.test.ts — the deed list (record, cap, surfaced, who reacted), perks that follow the party, journalOf, and the tier banner line table
import { describe, expect, it } from 'vitest'
import { heldTraits, resolveCheck, checkOdds } from '../../src/engine/checks'
import { DEED_KEEP } from '../../src/engine/deeds'
import { apply, applyAll } from '../../src/engine/effects'
import { journalOf } from '../../src/engine/journal'
import { PERKS, TRAIT_BONUS } from '../../src/story/traits'
import { TIER_LINES } from '../../src/story/tiers'
import { NPCS } from '../../src/story/characters'
import { deeds, makeState, social } from './fixtures'
import { makeStory } from './storyFixture'
import { reduce } from '../../src/engine/reducer'
import { startGame } from '../../src/engine/init'
import { loadTestChapterStory } from './testStory'
const story = makeStory([{ id: 'c1.a', text: 'x', end: 'auto' }], { perks: { brick: { trait: 'Bruiser', text: 'Grit +2.' } }, npcs: { nora: { name: 'Nora Vance', trust: 10, fear: 0 }, brick: { name: 'Brick', trust: 0, fear: 5 }, juno: { name: 'Juno', trust: 0, fear: 0 } } })
const withNora = (over = {}) => makeState({ party: ['nora'], ...over })
describe('deed list', () => {
  it('records a witnessed deed with its honor and who reacted', () => {
    const r = apply(['honor', 'mercy', true], withNora({ day: 3 }), deeds, social)
    expect(r.state.deeds).toEqual([{ tag: 'mercy', witnessed: true, surfaced: false, day: 3, delta: 5, who: { nora: 10 } }])
  })
  it('records an unwitnessed deed with the half now and nobody reacting', () => {
    const r = apply(['honor', 'murder', false], withNora(), deeds, social)
    expect(r.state.deeds).toEqual([{ tag: 'murder', witnessed: false, surfaced: false, day: 1, delta: -10, who: {} }])
  })
  it('records nothing for an unknown tag', () => {
    const r = apply(['honor', 'nope', true], makeState(), deeds, social)
    expect(r.state.deeds).toEqual([])
    expect(r.log[0]?.kind).toBe('ERROR')
  })
  it('adds a surfaced record per hidden deed when the secret is revealed: the first carries the honor paid, the party reacts in full', () => {
    const hid = applyAll([['honor', 'murder', false], ['honor', 'lie', false], ['secret', 'pantry']], withNora(), deeds, social).state
    const r = applyAll([['reveal', 'pantry']], hid, deeds, social).state
    const out = r.deeds.filter((d) => d.surfaced)
    expect(out.map((d) => d.tag)).toEqual(['murder', 'lie'])
    expect(out[0]).toMatchObject({ witnessed: false, delta: -11, who: { nora: -10 } })
    expect(out[1]).toMatchObject({ delta: 0, who: { nora: -5 } })
  })
  it('keeps only the last DEED_KEEP', () => {
    let s = makeState()
    for (let i = 0; i < DEED_KEEP + 5; i++) s = apply(['honor', 'honest', true], { ...s, day: 1 + (i % 20) }, deeds, social).state
    expect(s.deeds).toHaveLength(DEED_KEEP)
  })
})
describe('perks follow the party (D30)', () => {
  const perks = { brick: { trait: 'Bruiser', text: 'x' } }
  const bonus = (s = makeState({ party: ['brick'] })) => resolveCheck('grit', 99, s, TRAIT_BONUS, perks).bonus
  it('counts the perk while the companion is in the party and alive', () => {
    expect(heldTraits(makeState({ party: ['brick'] }), perks)).toEqual(['Bruiser'])
    expect(bonus()).toBe(2)
    expect(checkOdds('grit', 8, makeState({ party: ['brick'] }), TRAIT_BONUS, perks)).toBe('even')
  })
  it('drops it when he leaves, is killed or walks out, and never double counts a trait the player also holds', () => {
    const base = makeState({ party: ['brick'] })
    expect(bonus(apply(['party', '-brick'], base, deeds, social).state)).toBe(0)
    expect(bonus(apply(['kill', 'brick'], base, deeds, social).state)).toBe(0)
    const out = applyAll([['trust', 'brick', -40]], base, deeds, social).state // fear 5 does not hold him
    expect(out.party).toEqual([])
    expect(bonus(out)).toBe(0)
    expect(heldTraits(makeState({ party: ['brick'], traits: ['Bruiser'] }), perks)).toEqual(['Bruiser'])
  })
  it('a dead companion left in a hand-edited party gives no perk', () => {
    expect(heldTraits(makeState({ party: ['brick'], npc: { brick: { alive: false, trust: 0, fear: 0 } } }), perks)).toEqual([])
  })
})
describe('journalOf', () => {
  it('lists deeds newest first with who reacted', () => {
    let s = withNora()
    s = apply(['honor', 'mercy', true], s, deeds, social).state
    s = apply(['honor', 'lie', true], s, deeds, social).state
    const j = journalOf(s, story)
    expect(j.deeds.map((d) => d.tag)).toEqual(['lie', 'mercy'])
    expect(j.deeds[1]?.who).toEqual([{ id: 'nora', delta: 10 }])
  })
  it('shows the party first, then the dead and anyone whose trust or fear rose; strangers stay hidden', () => {
    const s = makeState({ party: ['nora'], npc: { nora: { alive: true, trust: 10, fear: 0 }, brick: { alive: true, trust: -10, fear: 5 }, juno: { alive: false, trust: 0, fear: 0 }, hart: { alive: true, trust: 0, fear: 0 } } })
    const j = journalOf(s, story)
    expect(j.people.map((p) => p.id)).toEqual(['nora', 'brick', 'juno'])
    expect(j.people[0]).toMatchObject({ name: 'Nora Vance', inParty: true, alive: true, trust: 10 })
    expect(j.people[2]).toMatchObject({ alive: false, inParty: false })
  })
  it('does not list someone whose fear only faded below its start, and lists them once it rises above it', () => {
    const faded = makeState({ npc: { brick: { alive: true, trust: 0, fear: 0 } } })
    expect(journalOf(faded, story).people).toEqual([])
    const scared = makeState({ npc: { brick: { alive: true, trust: 0, fear: 20 } } })
    expect(journalOf(scared, story).people.map((p) => p.id)).toEqual(['brick'])
  })
  it('puts a perk line on the card only for a companion who has one', () => {
    const s = makeState({ party: ['nora', 'brick'], npc: { nora: { alive: true, trust: 10, fear: 0 }, brick: { alive: true, trust: 0, fear: 5 } } })
    const j = journalOf(s, story)
    expect(j.people.find((p) => p.id === 'brick')?.perk).toBe('Grit +2.')
    expect(j.people.find((p) => p.id === 'nora')?.perk).toBeUndefined()
  })
})
describe('story tables for D30', () => {
  it('every perk names a companion in the cast and a trait with a check bonus', () => {
    for (const [id, p] of Object.entries(PERKS)) {
      expect(Object.hasOwn(NPCS, id)).toBe(true)
      expect(Object.hasOwn(TRAIT_BONUS, p.trait)).toBe(true)
      expect(p.text.length).toBeGreaterThan(0)
    }
  })
  it('every tier has a banner line and none says the forbidden words (D23)', () => {
    expect(Object.keys(TIER_LINES).sort()).toEqual(['T1', 'T2', 'T3', 'T4', 'T5'])
    for (const l of Object.values(TIER_LINES)) expect(l).not.toMatch(/zombie|undead/i)
  })
})
describe('real story: Brick\'s perk comes from the party, not a trait effect', () => {
  it('joining Brick gives the Bruiser bonus without the trait; the Journal lists him with his perk and the deed with who reacted', async () => {
    const real = await loadTestChapterStory()
    let s = { ...startGame(real, 'dockworker', 'Ash', 3).state, res: { food: 1, ammo: 1, meds: 0 } } // t.wake, with the Food and Ammo the first two choices cost
    s = reduce(s, { type: 'CHOOSE', choice: 'a' }, real) // shares with Nora: she joins
    s = reduce(s, { type: 'CHOOSE', choice: 'a' }, real) // t.street: threaten Brick, who joins
    expect(s.party).toEqual(['nora', 'brick'])
    expect(s.traits).not.toContain('Bruiser')
    expect(heldTraits(s, real.perks)).toContain('Bruiser')
    expect(s.deeds.at(-1)).toMatchObject({ tag: 'intimidate', witnessed: true, who: { nora: -5 } })
    const j = journalOf(s, real)
    expect(j.people.map((p) => p.id)).toEqual(['nora', 'brick'])
    expect(j.people[1]?.perk).toMatch(/Grit checks \+2/)
    expect(j.deeds[0]?.tag).toBe('intimidate')
    const gone = reduce(s, { type: 'DEBUG_SET', patch: { kind: 'honor', value: 0 } }, real) // debug actions are dropped by the UI, but the engine takes them: a no-op for the party
    expect(heldTraits(gone, real.perks)).toContain('Bruiser')
  })
})