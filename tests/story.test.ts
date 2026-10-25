// tests/story.test.ts — the real story: lint-clean, every effect kind used, golden paths, ending rules, assembly
import { describe, expect, it } from 'vitest'
import { reduce } from '../src/engine/reducer'
import { currentView } from '../src/engine/select'
import type { Action, GameState, Story } from '../src/engine/types'
import { effectsOf } from '../scripts/lintWalk'
import { lintStory } from '../scripts/lintCore'
import { resolveEnding } from '../src/engine/endings'
import { BACKGROUNDS } from '../src/story/backgrounds'
import { chapters } from '../src/story/chapters/index'
import { ENDINGS } from '../src/story/endings'
import { FLAGS } from '../src/story/flags'
import { buildStory, loadStory, START_SCENE, TABLES } from '../src/story/index'
import { SYSTEM_SCENES } from '../src/story/system'
import { makeState } from './engine/fixtures'
import { loadTestChapterStory } from './engine/testStory'
const choose = (c: 'a' | 'b' | 'c' | 'd'): Action => ({ type: 'CHOOSE', choice: c })
const go: Action = { type: 'CONTINUE' }
async function play(bg: string, ...actions: Action[]): Promise<{ s: GameState; story: Story }> {
  const story = await loadTestChapterStory()
  const start = reduce(makeState(), { type: 'START', bg, name: 'Ash', seed: 11 }, story)
  return { s: actions.reduce((s, a) => reduce(s, a, story), start), story }
}
describe('test chapter', () => {
  it('the whole story lints with no errors and no warnings', async () => {
    const loaded = await Promise.all(Object.entries(chapters).map(async ([k, load]) => [k, (await load()).scenes] as const))
    expect(lintStory(Object.fromEntries(loaded), SYSTEM_SCENES, TABLES, FLAGS)).toEqual({ errors: [], warnings: [] })
  })
  it('uses every effect kind and the check / lock / cost / echo / time / glitch features', async () => {
    const story = await loadStory()
    const scenes = Object.values(story.scenes)
    const kinds = new Set(scenes.flatMap((s) => effectsOf(s).map((e) => e[0])))
    expect([...kinds].sort()).toEqual(['clear', 'echo', 'fear', 'honor', 'kill', 'party', 'res', 'reveal', 'secret', 'set', 'stat', 'time', 'trait', 'trust'])
    const choices = scenes.flatMap((s) => s.choices ?? [])
    expect(choices.some((c) => c.check !== undefined)).toBe(true)
    expect(choices.some((c) => c.lock !== undefined)).toBe(true)
    expect(choices.some((c) => c.cost !== undefined)).toBe(true)
    expect(choices.some((c) => c.echo !== undefined)).toBe(true)
    expect(scenes.some((s) => s.time !== undefined && s.id.startsWith('t.'))).toBe(true)
    expect(scenes.some((s) => s.glitch !== undefined)).toBe(true)
  })
  it('golden path: share, slip past, rebroadcast -> echo fires at the gate -> Lighthouse', async () => {
    const { s, story } = await play('dockworker', choose('a'), choose('d'), choose('b'))
    expect(s.scene).toBe('t.echo')
    expect(s.resume).toBe('t.end')
    expect(s).toMatchObject({ honor: 5, party: ['nora'], day: 2, phase: 'dawn', flags: { final_stay: true, broadcast_changed: true } })
    expect(s.res.food).toBe(0)
    expect(s.npc['nora']?.trust).toBe(20)
    const end = reduce(s, go, story)
    expect(currentView(end, story)).toMatchObject({ kind: 'end', ending: 'lighthouse' })
    expect(end.history).toEqual(['t.wake:a', 't.street:d', 't.gate:b', 't.echo:>'])
  })
  it('golden path: threatening Brick with Nora beside you costs Nora trust (approval table, D29)', async () => {
    const ammo: Action = { type: 'DEBUG_SET', patch: { kind: 'res', key: 'ammo', value: 1 } } // no background starts with both Food (t.wake a) and Ammo (t.street a)
    const { s } = await play('dockworker', choose('a'), ammo, choose('a'))
    // share with Nora: she is not in the party yet when the deed lands, so only the authored +10 counts (10 -> 20); intimidate then makes her flinch (-5)
    expect(s.party).toEqual(['nora', 'brick'])
    expect(s.npc['nora']?.trust).toBe(15)
    expect(s.npc['brick']).toMatchObject({ trust: 0, fear: 20 }) // Brick joined after the deed: no reaction, and his fear is authored
    expect(s.log.map((e) => e.text)).toContain('nora reacts to intimidate: trust -5 -> 15')
  })
  it('golden path: steal, confess, leave everyone -> secret surfaces -> Rot Within', async () => {
    const { s, story } = await play('mechanic', choose('b'), choose('b'), choose('c'))
    // steal -6 unseen: -3 now, -3 owed; reveal pays -3; honest +2; abandon -10
    expect(s.honor).toBe(-3 - 3 + 2 - 10)
    expect(s).toMatchObject({ secrets: [], owed: {}, scene: 't.end' })
    expect(s.npc['nora']?.alive).toBe(false)
    expect(currentView(s, story).ending).toBe('rot_within')
  })
  it('golden path: charging the horde ends in death, not an ending rule', async () => {
    const { s, story } = await play('teacher', choose('b'), choose('d'), choose('d'))
    expect(s.scene).toBe('sys.death')
    expect(currentView(s, story).ending).toBe('death')
  })
  it('the street shows the Nora and secret callbacks, a locked option, and the glitch text at low reason', async () => {
    const { s, story } = await play('dockworker', choose('a'))
    const v = currentView(s, story)
    expect(v.lines.join(' ')).toContain('Nora stays close')
    expect(v.choices.find((c) => c.id === 'a')).toMatchObject({ enabled: false, why: 'cost' })
    expect(v.choices.map((c) => c.id)).toEqual(['a', 'c', 'd'])
    const low = { ...s, stats: { ...s.stats, reason: 10 } }
    expect(currentView(low, story).lines).toEqual(['The street breathes. The bell says your name, and the bus is smiling.'])
  })
})
describe('ending rules', () => {
  const allies = { nora: { alive: true, trust: 40, fear: 0 }, brick: { alive: true, trust: 40, fear: 0 }, juno: { alive: true, trust: 40, fear: 0 }, hart: { alive: true, trust: 0, fear: 0 } }
  const ending = (o: Partial<GameState>): string => resolveEnding(makeState(o), ENDINGS)
  it('Beacon needs honor 61+, final_lead and three allies at trust 30+', () => {
    expect(ending({ honor: 70, flags: { final_lead: true }, npc: allies })).toBe('beacon')
    expect(ending({ honor: 70, flags: { final_lead: true }, npc: { ...allies, juno: { alive: false, trust: 40, fear: 0 } } })).toBe('last_seat')
    expect(ending({ honor: 60, flags: { final_lead: true }, npc: allies })).toBe('last_seat')
  })
  it('the other endings follow STORYBOARD §4, top to bottom', () => {
    expect(ending({ honor: -70, flags: { route_fear: true } })).toBe('warden_of_the_dead')
    expect(ending({ stats: { hp: 3, reason: 19, rot: 0 }, honor: -70, flags: { route_fear: true } })).toBe('warden_of_the_dead')
    expect(ending({ stats: { hp: 3, reason: 19, rot: 0 } })).toBe('broken_reason')
    expect(ending({ stats: { hp: 3, reason: 50, rot: 100 } })).toBe('rot_within')
    expect(ending({ flags: { nora_turned: true } })).toBe('rot_within')
    const cast = { juno: { alive: true, trust: 0, fear: 0 }, biscuit: { alive: true, trust: 0, fear: 0 } }
    expect(ending({ flags: { final_stay: true, broadcast_changed: true }, npc: cast })).toBe('lighthouse')
    expect(ending({ flags: { final_stay: true, broadcast_changed: true }, npc: { ...cast, juno: { alive: false, trust: 0, fear: 0 } } })).toBe('last_seat')
    expect(ending({})).toBe('last_seat')
  })
})
describe('story assembly', () => {
  it('the three backgrounds match CHARACTERS.md', () => {
    expect(Object.keys(BACKGROUNDS)).toEqual(['dockworker', 'mechanic', 'teacher'])
    expect(BACKGROUNDS['dockworker']?.attr).toEqual({ grit: 4, wits: 2, heart: 3 })
    expect(BACKGROUNDS['mechanic']?.trait).toBe('Fixer')
    expect(BACKGROUNDS['teacher']?.res.meds).toBe(2)
  })
  it('buildStory indexes scenes by id and carries the tables', () => {
    const s = buildStory(SYSTEM_SCENES)
    expect(Object.keys(s.scenes)).toEqual(['sys.missing', 'sys.error', 'sys.death'])
    expect(s).toMatchObject({ start: START_SCENE, endings: ENDINGS })
  })
})
