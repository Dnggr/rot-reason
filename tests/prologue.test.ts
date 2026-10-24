// tests/prologue.test.ts — the intro (Prologue part 1): story-first pacing on every route, the Dole echo, Biscuit, the radio, and "nobody has a word for it" (D22, D23)
import { describe, expect, it } from 'vitest'
import { reduce } from '../src/engine/reducer'
import { currentView } from '../src/engine/select'
import type { GameState, Story } from '../src/engine/types'
import { S } from '../src/ui/strings'
import { loadStory } from '../src/story/index'
import { makeState } from './engine/fixtures'
type Picks = Record<string, string>
const ROUTE: Picks = { 'p.stairs': 'b', 'p.dole': 'b', 'p.radio': 'c' }
// Plays the intro from the first scene to t.wake: continues through narration, takes `picks[scene]` at each choice scene.
function tour(story: Story, bg: string, seed: number, picks: Picks): GameState {
  let s = reduce(makeState(), { type: 'START', bg, name: 'Ash', seed }, story)
  for (let i = 0; i < 80 && s.scene !== 't.wake'; i += 1) {
    const v = currentView(s, story)
    if (v.kind === 'next') s = reduce(s, { type: 'CONTINUE' }, story)
    else if (v.kind === 'choices') s = reduce(s, { type: 'CHOOSE', choice: (picks[s.scene] ?? 'z') as 'a' }, story)
    else throw new Error(`unexpected ${v.kind} at ${s.scene}`)
  }
  return s
}
const story = await loadStory()
const share = (s: GameState): number => s.history.filter((h) => h.endsWith(':>')).length / s.history.length
const scenesPlayed = (s: GameState): string[] => s.history.map((h) => h.slice(0, h.indexOf(':')))
describe('the intro: who talks (UI_UX §3)', () => {
  const who = (scene: string): (string | undefined)[] => currentView(makeState({ scene }), story).beats.map((b) => b.say)
  it('Dole speaks his own lines at the door, with narration between them', () => {
    expect(who('p.dole')).toEqual(['dole', undefined, 'dole', 'dole', undefined])
    expect(currentView(makeState({ scene: 'p.dole' }), story).beats[0]?.text).toBe('"Hey, it\'s Walt, 3B."')
  })
  it('Juno speaks the three lines on the radio after the narration', () => {
    expect(who('p.voice')).toEqual([undefined, 'juno', 'juno', 'juno'])
  })
})
describe('the intro: pacing (D22)', () => {
  it('starts at p.dream and hands over to t.wake', () => {
    expect(story.start).toBe('p.dream')
    expect(tour(story, 'dockworker', 3, ROUTE).scene).toBe('t.wake')
  })
  it('every route is at least 85% narration, by what the player actually plays', () => {
    for (const bg of ['dockworker', 'mechanic', 'teacher']) {
      for (const stairs of ['a', 'b', 'c']) {
        for (const dole of ['a', 'b', 'c']) {
          for (const radio of ['a', 'b', 'c']) {
            const s = tour(story, bg, 5, { 'p.stairs': stairs, 'p.dole': dole, 'p.radio': radio })
            expect(share(s), `${bg} ${stairs}${dole}${radio}`).toBeGreaterThanOrEqual(0.85)
          }
        }
      }
    }
  })
})
describe('the intro: Dole', () => {
  it('letting him in: honor +5, the echo fires two scenes later, then play resumes at dusk', () => {
    const s = tour(story, 'dockworker', 3, { ...ROUTE, 'p.dole': 'a' })
    const played = scenesPlayed(s)
    expect(played.slice(played.indexOf('p.dole'), played.indexOf('p.dusk') + 1)).toEqual(['p.dole', 'p.dole_in', 'p.hours', 'p.dole_knocks', 'p.dusk'])
    expect(s.flags['dole_inside']).toBe(true)
    expect(s.honor).toBe(5)
  })
  it('the echo never fires on the other two routes', () => {
    for (const dole of ['b', 'c']) expect(scenesPlayed(tour(story, 'mechanic', 3, { ...ROUTE, 'p.dole': dole }))).not.toContain('p.dole_knocks')
  })
  it('keeping him out costs honor 10; sending him on gives 2 honor and 3 Reason', () => {
    const out = tour(story, 'teacher', 3, { ...ROUTE, 'p.dole': 'b' })
    const sent = tour(story, 'teacher', 3, { ...ROUTE, 'p.dole': 'c' })
    expect(out.honor).toBe(-10)
    expect(out.flags['dole_out']).toBe(true)
    expect(sent.honor).toBe(2)
    expect(sent.flags['dole_sent']).toBe(true)
    expect(sent.stats.reason).toBe(out.stats.reason - 3)
  })
})
describe('the intro: Biscuit and the radio', () => {
  it('both rescue checks bring Biscuit home; only a noisy one costs 1 HP', () => {
    const results = new Set<string>()
    for (const pick of ['a', 'b']) {
      for (let seed = 1; seed <= 40; seed += 1) {
        const s = tour(story, 'dockworker', seed, { ...ROUTE, 'p.stairs': pick })
        expect(s.party).toContain('biscuit')
        expect(s.stats.hp).toBe(s.flags['stairs_noise'] === true ? 4 : 5)
        results.add(s.flags['stairs_noise'] === true ? 'noise' : 'quiet')
      }
    }
    expect([...results].sort()).toEqual(['noise', 'quiet'])
  })
  it('shutting the door on him leaves him behind and costs Reason, not HP', () => {
    const s = tour(story, 'dockworker', 3, { ...ROUTE, 'p.stairs': 'c' })
    expect(s.party).not.toContain('biscuit')
    expect(s.flags['biscuit_left']).toBe(true)
    expect(s.stats.hp).toBe(5)
  })
  it('each radio choice leaves its own mark and sets heard_haven', () => {
    const marks = { a: 'haven_trust', b: 'haven_doubt', c: 'radio_off' }
    for (const [pick, flag] of Object.entries(marks)) {
      const s = tour(story, 'mechanic', 3, { ...ROUTE, 'p.radio': pick })
      expect([s.flags[flag], s.flags['heard_haven']]).toEqual([true, true])
    }
  })
})
describe('the intro: nobody has a word for it (D23)', () => {
  it('"the Rot" is not named until the Haven broadcast (p.static)', () => {
    const order = Object.keys(story.scenes).filter((id) => id.startsWith('p.'))
    const before = order.slice(0, order.indexOf('p.static'))
    for (const id of before) expect(JSON.stringify(story.scenes[id]), id).not.toMatch(/\bRot\b/)
  })
  it('the Background screen does not name the threat either', () => {
    expect(S.chooseBackground).not.toMatch(/rot|zombie|dead/i)
  })
})
