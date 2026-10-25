// tests/engine/schema.test.ts — Zod story schema: accepts the STORY_FORMAT contract, rejects each broken shape
import { describe, expect, it } from 'vitest'
import type { ZodType } from 'zod'
import { choiceSchema, conditionSchema, effectSchema, sceneSchema, scenesSchema } from '../../src/engine/schema'
import type { Condition, Effect, Scene } from '../../src/engine/types'
// the example from STORY_FORMAT §6, verbatim
const contract = {
  id: 'c2.crypt',
  mood: 'dread',
  who: ['hart'],
  text: [
    'The crypt door is warm. Something knocks, slow and patient.',
    { if: ['trust', 'nora', '>=', 20], text: 'Nora whispers: "Ash, don\'t."' },
  ],
  choices: [
    { id: 'a', tone: 'honest', text: 'Tell the congregation what is down here.', fx: [['honor', 'honest', true], ['trust', 'hart', -40], ['reveal', 'hart_wife']], to: 'c2.toll' },
    { id: 'b', tone: 'mercy', text: 'End her suffering, quietly.', fx: [['honor', 'mercy', false], ['secret', 'hart_wife'], ['trust', 'hart', -10]], echo: { scene: 'c4.hart_knows', after: 14 }, to: 'c2.toll' },
    { id: 'c', tone: 'quiet', text: 'Walk away. You saw nothing.', fx: [['secret', 'hart_wife']], to: 'c2.toll' },
  ],
}
const ok = (v: unknown, schema: ZodType = sceneSchema) => expect(schema.safeParse(v).success).toBe(true)
const bad = (v: unknown, schema: ZodType = sceneSchema) => expect(schema.safeParse(v).success).toBe(false)
const narration = { id: 'c1.a', text: 'Rain.', next: 'c1.b' }
const choice = { id: 'a', text: 'Go.', to: 'c1.b' }
describe('scene schema', () => {
  it('accepts the STORY_FORMAT contract example', () => ok(contract))
  it('output is assignable to the Scene type', () => {
    const s: Scene = sceneSchema.parse(contract)
    expect(s.id).toBe('c2.crypt')
    expect(scenesSchema.parse([narration])).toHaveLength(1)
  })
  it('accepts a spoken beat (`say`) with or without a condition, and rejects a malformed one', () => {
    ok({ ...narration, text: ['Rain.', { say: 'nora', text: '"Hi."' }, { say: 'nora', if: ['flag', 'x'], text: '"Hi."' }] })
    bad({ ...narration, text: [{ say: '', text: '"Hi."' }] })
    bad({ ...narration, text: [{ say: 'nora' }] })
    bad({ ...narration, text: [{ say: 'nora', text: '"Hi."', extra: 1 }] })
  })
  it('accepts narration, end and gate scenes', () => {
    ok(narration)
    ok({ id: 'c5.end', text: 'Fin.', end: 'beacon' })
    ok({ id: 'c1.gate', text: 'Gate.', tags: ['gate'], time: { day: 2, phase: 'night' }, choices: [choice] })
  })
  it('rejects missing id/text, unknown keys, bad mood and tags', () => {
    bad({ text: 'x', next: 'y' })
    bad({ id: 'a', next: 'y' })
    bad({ ...narration, extra: 1 })
    bad({ ...narration, mood: 'happy' })
    bad({ ...narration, tags: ['boss'] })
  })
  it('needs exactly one of choices / next / end', () => {
    bad({ id: 'a', text: 'x' })
    bad({ ...narration, choices: [choice] })
    bad({ ...narration, end: 'dead' })
    bad({ id: 'a', text: 'x', choices: [] })
  })
  it('allows at most 4 unique choices and 3 characters on screen', () => {
    const cs = ['a', 'b', 'c', 'd'].map((i) => ({ ...choice, id: i }))
    ok({ id: 'a', text: 'x', choices: cs })
    bad({ id: 'a', text: 'x', choices: [...cs, { ...choice, id: 'a' }] })
    bad({ id: 'a', text: 'x', choices: [choice, choice] })
    bad({ ...narration, who: ['a', 'b', 'c', 'd'] })
  })
})
describe('choice schema', () => {
  it('needs exactly one of to / check', () => {
    const check = { attr: 'wits', dc: 4, pass: { to: 'p' }, fail: { fx: [['stat', 'hp', -1]], to: 'f' } }
    ok({ id: 'a', text: 'Try.', check }, choiceSchema)
    bad({ id: 'a', text: 'Try.' }, choiceSchema)
    bad({ ...choice, check }, choiceSchema)
  })
  it('limits text to 12 words and ids to a-d', () => {
    ok({ ...choice, text: 'one two three four five six seven eight nine ten eleven twelve' }, choiceSchema)
    bad({ ...choice, text: 'one two three four five six seven eight nine ten eleven twelve thirteen' }, choiceSchema)
    bad({ ...choice, id: 'e' }, choiceSchema)
  })
  it('validates tone, cost and echo', () => {
    ok({ ...choice, tone: 'cold', cost: { food: 1, ammo: 2 } }, choiceSchema)
    bad({ ...choice, tone: 'rude' }, choiceSchema)
    bad({ ...choice, cost: { gold: 1 } }, choiceSchema)
    bad({ ...choice, cost: { food: 0 } }, choiceSchema)
    bad({ ...choice, echo: { scene: 'x' } }, choiceSchema)
    bad({ ...choice, echo: { scene: 'x', after: 3, at: 'c4' } }, choiceSchema)
    ok({ ...choice, echo: { scene: 'x', at: 'c4' } }, choiceSchema)
  })
})
describe('condition schema', () => {
  const good: unknown[] = [
    ['flag', 'route_church'], ['honor', '>=', 21], ['tier', '>=', 'T4'], ['res', 'food', '>=', 2],
    ['stat', 'reason', '<', 30], ['attr', 'wits', '>=', 3], ['trait', 'Medic'], ['alive', 'nora'],
    ['party', 'brick'], ['trust', 'nora', '>=', 30], ['fear', 'vera', '>=', 40], ['bg', 'dockworker'],
    ['day', '>=', 10], ['secret', 'hart_wife'],
  ]
  it.each(good.map((c) => [c]))('accepts %j', (c) => ok(c, conditionSchema))
  it('accepts nested all / any / not', () => {
    const nested: Condition = { all: [['flag', 'a'], { any: [['alive', 'nora'], { not: ['party', 'brick'] }] }] }
    ok(nested, conditionSchema)
  })
  it('rejects unknown kinds, bad operands and empty combinators', () => {
    bad(['mood', 'happy'], conditionSchema)
    bad(['honor', '>=', 'high'], conditionSchema)
    bad(['honor', '=>', 3], conditionSchema)
    bad(['tier', '>=', 'T9'], conditionSchema)
    bad(['res', 'gold', '>=', 1], conditionSchema)
    bad(['flag'], conditionSchema)
    bad({ all: [] }, conditionSchema)
    bad({ all: [['flag', 'a']], not: ['flag', 'b'] }, conditionSchema)
  })
})
describe('effect schema', () => {
  const good: unknown[] = [
    ['honor', 'mercy', true], ['stat', 'hp', -1], ['res', 'food', -1], ['set', 'route_church'], ['clear', 'x'],
    ['trust', 'nora', 10], ['fear', 'brick', 5], ['party', '+juno'], ['party', '-juno'], ['kill', 'nora'],
    ['trait', '+Hardened'], ['secret', 'hart_wife'], ['reveal', 'hart_wife'],
    ['echo', { scene: 'c4.father', after: 12 }], ['echo', { scene: 'c4.father', at: 'c4' }],
    ['time', { day: 1, phase: 'night' }],
  ]
  it.each(good.map((e) => [e]))('accepts %j', (e) => ok(e, effectSchema))
  it('output is assignable to the Effect type', () => {
    const e: Effect = effectSchema.parse(['echo', { scene: 's', after: 2 }])
    expect(e[0]).toBe('echo')
  })
  it('rejects unknown kinds, bad shapes and unsigned party/trait', () => {
    bad(['teleport', 'c2'], effectSchema)
    bad(['honor', 'mercy'], effectSchema)
    bad(['honor', 'mercy', 'yes'], effectSchema)
    bad(['stat', 'luck', 1], effectSchema)
    bad(['stat', 'hp', Number.NaN], effectSchema)
    bad(['party', 'juno'], effectSchema)
    bad(['trait', 'Hardened'], effectSchema)
    bad(['echo', { scene: 'x' }], effectSchema)
    bad(['time', { phase: 'noon' }], effectSchema)
  })
})
describe('effect deltas are whole numbers', () => {
  it('rejects a fractional stat, res, trust or fear change, accepts whole ones', () => {
    for (const e of [['stat', 'hp', -0.5], ['res', 'food', 1.5], ['trust', 'nora', 2.5], ['fear', 'brick', 0.1]]) bad(e, effectSchema)
    for (const e of [['stat', 'hp', -1], ['res', 'food', 2], ['trust', 'nora', -25], ['fear', 'brick', 5]]) ok(e, effectSchema)
  })
})
