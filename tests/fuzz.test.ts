// tests/fuzz.test.ts — the fuzz bot: clean on the real story, and it catches soft-locks, loops, error logs and fallback endings
import { describe, expect, it } from 'vitest'
import { runFuzz } from '../scripts/fuzzRun'
import type { Scene } from '../src/engine/types'
import { loadStory } from '../src/story/index'
import { makeStory } from './engine/storyFixture'
const why = (scenes: Scene[]): string[] => runFuzz(makeStory(scenes), 3, 5).failures.map((f) => f.why)
describe('runFuzz', () => {
  it('is clean on the real story, reaches several endings, and is deterministic', async () => {
    const story = await loadStory()
    const a = runFuzz(story, 150, 1)
    expect(a.failures).toEqual([])
    expect(a.runs).toBe(150)
    expect(Object.keys(a.endings).length).toBeGreaterThanOrEqual(3)
    expect(a.never).toContain('beacon')
    expect(runFuzz(story, 150, 1)).toEqual(a)
  })
  it('reports a soft-lock when every choice is disabled', () => {
    expect(why([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', lock: ['flag', 'never'], to: 'c1.a' }] }])[0]).toContain('soft-lock: no enabled choice at c1.a')
  })
  it('reports a loop', () => {
    expect(why([{ id: 'c1.a', text: 'x', next: 'c1.b' }, { id: 'c1.b', text: 'y', next: 'c1.a' }])[0]).toContain('loop: more than 500 steps')
  })
  it('reports ERROR log lines and fallback endings', () => {
    expect(why([{ id: 'c1.a', text: 'x', next: 'c1.nowhere' }])[0]).toContain('ERROR log: missing scene c1.nowhere')
    expect(why([{ id: 'c1.a', text: 'x', end: 'sys_error' }])[0]).toContain('fallback ending at c1.a')
  })
  it('reports invalid state', () => {
    expect(why([{ id: 'c1.a', text: 'x', on: [['stat', 'hp', 1]], next: 'c1.b' }, { id: 'c1.b', text: 'y', end: 'plain' }])).toEqual([])
    const bad = makeStory([{ id: 'c1.a', text: 'x', end: 'plain' }], { backgrounds: { dockworker: { name: 'D', attr: { grit: 99, wits: 1, heart: 1 }, trait: 'x', stats: { hp: 5, reason: 80, rot: 0 }, res: { food: 0, ammo: 0, meds: 0 } } } })
    expect(runFuzz(bad, 1, 1).failures[0]?.why).toContain('invalid state: attr.grit')
  })
})
