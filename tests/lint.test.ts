// tests/lint.test.ts — lintStory: each schema, graph, reference and style check fires on a tiny broken story and stays quiet on a good one
import { describe, expect, it } from 'vitest'
import type { Scene, StoryTables } from '../src/engine/types'
import { lintStory } from '../scripts/lintCore'
import { makeStory, sys } from './engine/storyFixture'
const { scenes: _scenes, ...tables } = makeStory([{ id: 'c1.a', text: 'x', end: 'plain' }])
const flags = { known: 'a flag the tests may use', other: 'another flag' }
const base: Scene[] = [
  { id: 'c1.a', text: 'start', choices: [{ id: 'a', text: 'Go.', fx: [['honor', 'mercy', true]], to: 'c1.b' }, { id: 'b', text: 'Stay.', to: 'c1.b' }] },
  { id: 'c1.b', text: 'end', end: 'plain' },
]
const lint = (scenes: Scene[] | unknown[], over: Partial<StoryTables> = {}, f: Record<string, string> = flags) =>
  lintStory({ ch: scenes }, sys, { ...tables, start: 'c1.a', ...over }, f)
const has = (list: string[], part: string): boolean => list.some((x) => x.includes(part))
describe('lintStory: good story', () => {
  it('has no errors and no warnings', () => {
    expect(lint(base)).toEqual({ errors: [], warnings: [] })
  })
})
describe('lintStory: schema and ids', () => {
  it('reports schema failures with the scene and path', () => {
    const r = lint([{ id: 'c1.a', text: 'x' }])
    expect(has(r.errors, "ch[0]: scene needs exactly one of 'choices', 'next' or 'end'")).toBe(true)
  })
  it('reports duplicate ids and ids without a chapter prefix', () => {
    expect(has(lint([...base, base[1]]).errors, 'duplicate scene id: c1.b')).toBe(true)
    expect(has(lint([{ id: 'lonely', text: 'x', end: 'plain' }, ...base]).errors, 'must look like <chapter>.<name>')).toBe(true)
  })
})
describe('lintStory: graph', () => {
  const withScene = (s: Scene): Scene[] => [base[0] as Scene, base[1] as Scene, s]
  it('reports missing targets for exits and echoes', () => {
    expect(has(lint([{ id: 'c1.a', text: 'x', next: 'c1.zz' }]).errors, 'target c1.zz does not exist')).toBe(true)
    const e = lint([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', echo: { scene: 'c9.zz', after: 1 }, to: 'c1.b' }] }, base[1]])
    expect(has(e.errors, 'target c9.zz does not exist')).toBe(true)
  })
  it('reports unreachable scenes, but counts echo targets as reachable', () => {
    expect(has(lint(withScene({ id: 'c1.island', text: 'x', end: 'plain' })).errors, 'c1.island: unreachable')).toBe(true)
    const echo: Scene = { id: 'c1.echo', tags: ['echo'], text: 'x', next: '$resume' }
    const scheduled = base.map((s) => (s.id === 'c1.a' ? { ...s, on: [['echo', { scene: 'c1.echo', after: 1 }]] } : s)) as Scene[]
    expect(lint([...scheduled, echo]).errors).toEqual([])
  })
  it('reports loops with no way out', () => {
    const r = lint([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', to: 'c1.b' }, { id: 'b', text: 'y', to: 'c1.end' }] }, { id: 'c1.b', text: 'x', next: 'c1.c' }, { id: 'c1.c', text: 'x', next: 'c1.b' }, { id: 'c1.end', text: 'x', end: 'plain' }])
    expect(has(r.errors, 'c1.b: no path to any ending')).toBe(true)
    expect(has(r.errors, 'c1.c: no path to any ending')).toBe(true)
    expect(has(r.errors, 'c1.a:')).toBe(false)
  })
  it('limits $resume to echo scenes and echo scenes to $resume', () => {
    expect(has(lint(withScene({ id: 'c1.r', text: 'x', next: '$resume' })).errors, "$resume is only for scenes tagged 'echo'")).toBe(true)
    expect(has(lint(withScene({ id: 'c1.r', tags: ['echo'], text: 'x', next: 'c1.b' })).errors, 'must exit with $resume only')).toBe(true)
  })
  it('checks ending ids, the default rule, the start scene and the system scenes', () => {
    expect(has(lint([{ id: 'c1.a', text: 'x', end: 'nonsense' }]).errors, 'unknown ending nonsense')).toBe(true)
    expect(has(lint(base, { endings: [{ id: 'only', if: ['flag', 'known'] }] }).errors, 'the last ending rule must have no condition')).toBe(true)
    expect(has(lint(base, { endings: [] }).errors, 'the last ending rule')).toBe(true)
    expect(has(lint(base, { start: 'c1.nope' }).errors, 'start scene c1.nope does not exist')).toBe(true)
    expect(has(lintStory({ ch: base }, [], tables, flags).errors, 'system scene sys.death is missing')).toBe(true)
    expect(has(lintStory({ ch: base }, [{ id: 'sys.missing', text: 'x', next: 'c1.a' }, ...sys.slice(1)], tables, flags).errors, 'system scenes must be end scenes')).toBe(true)
  })
})
describe('lintStory: references', () => {
  const one = (fx: unknown[], text: unknown = 'x'): Scene[] => [{ id: 'c1.a', text: text as string, choices: [{ id: 'a', text: 'x', fx, to: 'c1.b' }, { id: 'b', text: 'y', to: 'c1.b' }] } as Scene, base[1] as Scene]
  it('rejects unknown flags in effects, conditions and endings', () => {
    expect(has(lint(one([['set', 'ghost']])).errors, 'c1.a: unknown flag ghost')).toBe(true)
    expect(has(lint(one([['clear', 'ghost']])).errors, 'unknown flag ghost')).toBe(true)
    expect(has(lint(one([], [{ if: ['flag', 'ghost'], text: 'x' }])).errors, 'unknown flag ghost')).toBe(true)
    expect(has(lint(base, { endings: [{ id: 'e', if: { all: [['flag', 'ghost'], ['alive', 'ghost'], { not: ['trust', 'nora', '>', 1] }] } }, { id: 'last' }] }).errors, 'ending e: unknown flag ghost')).toBe(true)
  })
  it('rejects unknown characters, deed tags and backgrounds', () => {
    expect(has(lint(one([['trust', 'ghost', 5]])).errors, 'unknown character ghost')).toBe(true)
    expect(has(lint(one([['party', '+ghost']])).errors, 'unknown character ghost')).toBe(true)
    expect(has(lint(one([['kill', 'ghost']])).errors, 'unknown character ghost')).toBe(true)
    expect(has(lint([{ ...base[0], who: ['ghost'] } as Scene, base[1] as Scene]).errors, 'c1.a who: unknown character ghost')).toBe(true)
    expect(has(lint(one([], [{ if: { any: [['party', 'ghost']] }, text: 'x' }])).errors, 'unknown character ghost')).toBe(true)
    expect(has(lint(one([], [{ say: 'ghost', text: '"Boo."' }])).errors, 'c1.a say: unknown character ghost')).toBe(true)
    expect(lint(one([], [{ say: 'nora', text: '"Hi."' }, { say: 'nora', if: ['flag', 'known'], text: '"Hello."' }])).errors).toEqual([])
    expect(has(lint(one([['honor', 'sneeze', true]])).errors, 'unknown deed tag sneeze')).toBe(true)
    expect(has(lint(one([], [{ if: ['bg', 'astronaut'], text: 'x' }])).errors, 'unknown background astronaut')).toBe(true)
  })
})
describe('lintStory: warnings', () => {
  const warnOf = (fx: unknown[], text = 'x') => lint([{ id: 'c1.a', text, choices: [{ id: 'a', text: 'x', fx, to: 'c1.b' }, { id: 'b', text: 'y', fx: [['honor', 'mercy', true]], to: 'c1.b' }] } as Scene, base[1] as Scene]).warnings
  it('flags set but never read, and read but never set', () => {
    expect(has(warnOf([['set', 'known']]), 'flag known is set but never read')).toBe(true)
    const read = lint([{ id: 'c1.a', text: [{ if: ['flag', 'other'], text: 'x' }, 'y'], choices: [{ id: 'a', text: 'x', fx: [['honor', 'mercy', true]], to: 'c1.b' }, { id: 'b', text: 'y', to: 'c1.b' }] } as Scene, base[1] as Scene])
    expect(has(read.warnings, 'flag other is read but never set')).toBe(true)
  })
  it('flags recruiting a companion who would walk out at once, in either order (D31)', () => {
    expect(has(warnOf([['trust', 'nora', -45], ['party', '+nora']]), 'party +nora with trust -35 / fear 20 would walk out at once')).toBe(true)
    expect(has(warnOf([['party', '+nora'], ['trust', 'nora', -45]]), 'nora joins, then ends the list with trust -35')).toBe(true)
    expect(has(warnOf([['party', '+nora'], ['trust', 'nora', -20]]), 'walk out')).toBe(false) // -10: stays
    expect(has(warnOf([['trust', 'nora', -45], ['fear', 'nora', 45], ['party', '+nora']]), 'walk out')).toBe(false) // fear 65 holds her
  })
  it('flags a reveal without a held secret', () => {
    expect(has(warnOf([['reveal', 'hart_wife']]), 'reveal hart_wife but no scene holds that secret')).toBe(true)
    expect(has(warnOf([['secret', 'hart_wife'], ['reveal', 'hart_wife']]), 'reveal')).toBe(false)
  })
  it('flags long scenes, fake choices, all-conditional choices and chapters without honor', () => {
    expect(has(warnOf([], Array(95).fill('word').join(' ')), 'text is 95 words')).toBe(true)
    const fake = lint([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', to: 'c1.b' }, { id: 'b', text: 'y', to: 'c1.b' }] }, base[1]])
    expect(has(fake.warnings, 'every choice has the same outcome')).toBe(true)
    expect(has(fake.warnings, 'chapter c1: no honor tag used')).toBe(true)
    const soft = lint([{ id: 'c1.a', text: 'x', choices: [{ id: 'a', text: 'x', if: ['flag', 'known'], fx: [['honor', 'mercy', true]], to: 'c1.b' }, { id: 'b', text: 'y', lock: ['flag', 'other'], to: 'c1.b' }] }, base[1]])
    expect(has(soft.warnings, 'possible soft-lock')).toBe(true)
  })
})
