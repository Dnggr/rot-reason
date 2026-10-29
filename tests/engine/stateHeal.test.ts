// tests/engine/stateHeal.test.ts — M3 s5 bug 5, closed in D34: a save from an older build is healed on load (npcs, flags, met, echoes, deeds, traits), and the ones that cannot be healed say why
import { describe, expect, it } from 'vitest'
import { startGame } from '../../src/engine/init'
import { pushLog } from '../../src/engine/log'
import { loadSave, makeSave } from '../../src/engine/save'
import { healState } from '../../src/engine/stateHeal'
import { loadableState, stateProblem } from '../../src/engine/stateSchema'
import type { GameState } from '../../src/engine/types'
import { makeStory } from './storyFixture'
const old = makeStory([{ id: 'c1.a', text: 'a', next: 'c1.b' }, { id: 'c1.b', text: 'b', next: 'c1.e' }, { id: 'c1.e', text: 'e', end: 'plain' }], { flags: { seen: 's', gone: 'g' }, npcs: { nora: { name: 'Nora', trust: 10, fear: 20 }, brick: { name: 'Brick', trust: 0, fear: 5 }, hart: { name: 'Hart', trust: 3, fear: 4 } } })
// The new build: Hart left, Dole came, the flag `gone` was removed, `lie` is no deed any more, the old chapter-9 echo has no scene.
const fresh = makeStory([{ id: 'c1.a', text: 'a', next: 'c1.b' }, { id: 'c1.b', text: 'b', next: 'c1.e' }, { id: 'c1.e', text: 'e', end: 'plain' }], { flags: { seen: 's' }, deeds: { mercy: 5 }, npcs: { nora: { name: 'Nora', trust: 10, fear: 20 }, brick: { name: 'Brick', trust: 0, fear: 5 }, dole: { name: 'Dole', trust: 7, fear: 1 } } })
const played = (): GameState => {
  const s = startGame(old, 'dockworker', 'Ash', 5).state
  const dead = { ...s.npc, hart: { alive: true, trust: 9, fear: 9 } }
  return { ...s, flags: { seen: true, gone: true }, npc: dead, met: ['nora', 'hart'], party: ['hart'], traits: ['Hauler', 'Retired'], echoes: [{ scene: 'c1.e', dueIn: 2 }, { scene: 'c9.zz', dueIn: 1 }, { scene: 'c1.e', atChapter: 'c9' }],
    deeds: [{ tag: 'mercy', witnessed: true, surfaced: false, day: 1, delta: 5, who: { hart: 5, nora: 2 } }, { tag: 'lie', witnessed: true, surfaced: false, day: 1, delta: -3, who: {} }], deedCount: { mercy: 1, lie: 1 }, history: ['c1.a:>'] }
}
describe('healState', () => {
  it('leaves a state that fits the story alone: the same object, no notes', () => {
    const s = startGame(fresh, 'dockworker', 'Ash', 5).state
    expect(healState(s, fresh)).toEqual({ state: s, notes: [] })
    expect(healState(s, fresh).state).toBe(s)
  })
  it('fills a new npc from the story and drops what the story no longer has, everywhere it was named', () => {
    const r = healState(played(), fresh)
    expect(stateProblem(r.state, fresh)).toBeUndefined()
    expect(r.state.npc).toEqual({ nora: played().npc['nora'], brick: played().npc['brick'], dole: { alive: true, trust: 7, fear: 1 } })
    expect(r.state).toMatchObject({ flags: { seen: true }, met: ['nora'], party: [], traits: ['Hauler'], echoes: [{ scene: 'c1.e', dueIn: 2 }], deedCount: { mercy: 1 } })
    expect(r.state.deeds).toEqual([{ tag: 'mercy', witnessed: true, surfaced: false, day: 1, delta: 5, who: { nora: 2 } }])
  })
  it('says what it did, once per kind, and writes the same lines to the log as FX', () => {
    const r = healState(played(), fresh)
    expect(r.notes).toEqual(expect.arrayContaining(['npc added from the story: dole', 'npc dropped (not in the story): hart', 'flag dropped (not in the story): gone', 'met dropped (not an npc): hart', 'party member dropped (not an npc): hart', 'echo dropped (its scene or chapter is gone): c9.zz, c1.e', 'deed dropped from the Journal (unknown tag): lie', 'deed count dropped (not a deed tag): lie', 'trait dropped (not a trait of the story): Retired']))
    const last = r.state.log.slice(-r.notes.length)
    expect(last.map((e) => e.kind)).toEqual(r.notes.map(() => 'FX'))
    expect(last[0]?.text).toBe(`healed on load, the story changed: ${r.notes[0]}`)
  })
  it('never touches the scene, background, chapter or numbers (those cannot be healed)', () => {
    const s = played()
    const r = healState({ ...s, scene: 'c1.gone', bg: 'pirate' }, fresh).state
    expect(r).toMatchObject({ scene: 'c1.gone', bg: 'pirate', honor: s.honor, stats: s.stats, day: s.day })
    expect(stateProblem(r, fresh)).toBe('scene c1.gone is not in the story')
  })
})
describe('loadSave heals before it refuses (D34)', () => {
  const save = () => makeSave(pushLog(played(), []), null, old, 9)
  it('a snapshot from the older build loads through the snapshot, with a `healed` list and the player keeps the run', () => {
    const r = loadSave(JSON.parse(JSON.stringify(save())), fresh)
    expect(r).toMatchObject({ ok: true, via: 'snapshot', healed: expect.arrayContaining(['npc added from the story: dole']) })
    if (r.ok) expect(r.save.snapshot).toMatchObject({ scene: 'c1.a', flags: { seen: true }, npc: { dole: { trust: 7 } } })
  })
  it('a fine save has no `healed` field, and the strict check still refuses the old one', () => {
    const ok = loadSave(makeSave(startGame(fresh, 'dockworker', 'Ash', 5).state, null, fresh, 1), fresh)
    expect(ok.ok && 'healed' in ok).toBe(false)
    expect(stateProblem(played(), fresh)).toBeDefined()
    expect(loadableState(played(), fresh)?.notes.length).toBeGreaterThan(0)
  })
  it('the checkpoint is healed too, and used when the snapshot cannot be (its scene is gone)', () => {
    const cp = played()
    const gone = { ...save(), snapshot: { ...played(), scene: 'c1.removed', chapter: 'c1' }, history: ['c1.removed:a'], checkpoint: cp }
    const r = loadSave(JSON.parse(JSON.stringify(gone)), fresh)
    expect(r).toMatchObject({ ok: true, via: 'checkpoint', healed: expect.any(Array) })
    if (r.ok) expect(r.save.checkpoint).toMatchObject({ npc: { dole: { alive: true } } })
  })
  it('a save nothing can rescue says why, and that it may be from an older build', () => {
    const lost = { ...save(), snapshot: { ...played(), scene: 'c1.removed' }, history: ['c1.removed:a'], checkpoint: null }
    expect(loadSave(JSON.parse(JSON.stringify(lost)), fresh)).toEqual({ ok: false, errors: ['snapshot is invalid: scene c1.removed is not in the story (this save may be from an older build of the story)', expect.stringContaining('replay step 0'), 'no checkpoint'] })
    const odd = loadSave({ ...JSON.parse(JSON.stringify(save())), snapshot: { nonsense: 1 }, history: ['x:z'] }, fresh)
    expect(odd).toMatchObject({ ok: false, errors: [expect.stringMatching(/^snapshot is invalid: /), expect.any(String), 'no checkpoint'] })
  })
})