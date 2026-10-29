// tests/engine/storyFixture.ts — tiny hand-built stories for reducer, select and save tests (not the real story)
import type { Scene, Story } from '../../src/engine/types'
import { deeds, social } from './fixtures'
export const sys: Scene[] = [
  { id: 'sys.missing', text: 'missing', end: 'sys_error' },
  { id: 'sys.error', text: 'error', end: 'sys_error' },
  { id: 'sys.death', text: 'dead', end: 'death' },
]
export function makeStory(scenes: Scene[], over: Partial<Story> = {}): Story {
  return {
    start: scenes[0]?.id ?? 'c1.a', deeds, social, traitBonus: { Bruiser: { grit: 2 } }, perks: {}, tiers: { T1: 'one', T2: 'two', T3: 'three', T4: 'four', T5: 'five' }, flags: {},
    backgrounds: { dockworker: { name: 'Dockworker', attr: { grit: 4, wits: 2, heart: 3 }, trait: 'Hauler', stats: { hp: 5, reason: 80, rot: 0 }, res: { food: 1, ammo: 0, meds: 0 } } },
    npcs: { nora: { name: 'Nora', trust: 10, fear: 20 }, brick: { name: 'Brick', trust: 0, fear: 5 } },
    endings: [{ id: 'good', if: ['honor', '>=', 5] }, { id: 'plain' }],
    scenes: Object.fromEntries([...sys, ...scenes].map((s) => [s.id, s])),
    ...over,
  }
}
// c1.a --(a)--> c1.b --next--> c2.a --(a)--> c2.end ; c1.a (b) = check, (c) = costs food and locked behind honor
export const line3: Scene[] = [
  { id: 'c1.a', text: 'start', choices: [
    { id: 'a', text: 'Go.', fx: [['honor', 'mercy', true]], to: 'c1.b' },
    { id: 'b', text: 'Try.', check: { attr: 'grit', dc: 6, pass: { fx: [['set', 'won']], to: 'c1.b' }, fail: { fx: [['stat', 'hp', -1]], to: 'c1.b' } } },
    { id: 'c', text: 'Pay.', cost: { food: 1 }, lock: ['honor', '>=', 5], to: 'c1.b' },
  ] },
  { id: 'c1.b', text: 'middle', next: 'c2.a' },
  { id: 'c2.a', text: 'chapter two', choices: [{ id: 'a', text: 'End.', to: 'c2.end' }] },
  { id: 'c2.end', text: 'fin', end: 'auto' },
]