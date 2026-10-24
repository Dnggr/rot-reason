// engine/schema.ts — Zod schemas for story data (STORY_FORMAT); parse(scene) validates shape, the linter does the graph
import { z } from 'zod'
import type { Condition } from './types'
const id = z.string().min(1)
const cmp = z.enum(['>=', '<=', '>', '<', '=='])
const num = z.number().finite()
const stat = z.enum(['hp', 'reason', 'rot'])
const res = z.enum(['food', 'ammo', 'meds'])
const attr = z.enum(['grit', 'wits', 'heart'])
const phase = z.enum(['dawn', 'day', 'dusk', 'night'])
const signed = z.string().regex(/^[+-].+/, "must start with '+' or '-'")
export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.tuple([z.literal('flag'), id]),
    z.tuple([z.literal('honor'), cmp, num]),
    z.tuple([z.literal('tier'), cmp, z.enum(['T1', 'T2', 'T3', 'T4', 'T5'])]),
    z.tuple([z.literal('res'), res, cmp, num]),
    z.tuple([z.literal('stat'), stat, cmp, num]),
    z.tuple([z.literal('attr'), attr, cmp, num]),
    z.tuple([z.literal('trait'), id]),
    z.tuple([z.literal('alive'), id]),
    z.tuple([z.literal('party'), id]),
    z.tuple([z.literal('trust'), id, cmp, num]),
    z.tuple([z.literal('fear'), id, cmp, num]),
    z.tuple([z.literal('bg'), id]),
    z.tuple([z.literal('day'), cmp, num]),
    z.tuple([z.literal('secret'), id]),
    z.strictObject({ all: z.array(conditionSchema).min(1) }),
    z.strictObject({ any: z.array(conditionSchema).min(1) }),
    z.strictObject({ not: conditionSchema }),
  ]),
)
const echoSpec = z
  .strictObject({ scene: id, after: z.exactOptional(z.number().int().min(1)), at: z.exactOptional(id) })
  .refine((e) => (e.after === undefined) !== (e.at === undefined), "echo needs exactly one of 'after' or 'at'")
const timeChange = z.strictObject({ day: z.exactOptional(z.number().int().min(1)), phase: z.exactOptional(phase) })
export const effectSchema = z.union([
  z.tuple([z.literal('honor'), id, z.boolean()]),
  z.tuple([z.literal('stat'), stat, num]),
  z.tuple([z.literal('res'), res, num]),
  z.tuple([z.literal('set'), id]),
  z.tuple([z.literal('clear'), id]),
  z.tuple([z.literal('trust'), id, num]),
  z.tuple([z.literal('fear'), id, num]),
  z.tuple([z.literal('party'), signed]),
  z.tuple([z.literal('kill'), id]),
  z.tuple([z.literal('trait'), signed]),
  z.tuple([z.literal('secret'), id]),
  z.tuple([z.literal('reveal'), id]),
  z.tuple([z.literal('echo'), echoSpec]),
  z.tuple([z.literal('time'), timeChange]),
])
const fx = z.array(effectSchema)
const branch = z.strictObject({ fx: z.exactOptional(fx), to: id })
const words = (s: string): number => s.trim().split(/\s+/).length
export const choiceSchema = z
  .strictObject({
    id: z.enum(['a', 'b', 'c', 'd']),
    text: z.string().min(1).refine((s) => words(s) <= 12, 'choice text is max 12 words'),
    tone: z.exactOptional(z.enum(['mercy', 'lie', 'threaten', 'brave', 'quiet', 'honest', 'cold'])),
    if: z.exactOptional(conditionSchema),
    lock: z.exactOptional(conditionSchema),
    cost: z.exactOptional(z.partialRecord(res, z.number().int().min(1))),
    fx: z.exactOptional(fx),
    check: z.exactOptional(z.strictObject({ attr, dc: z.number().int(), pass: branch, fail: branch })),
    to: z.exactOptional(id),
    echo: z.exactOptional(echoSpec),
  })
  .refine((c) => (c.to === undefined) !== (c.check === undefined), "choice needs exactly one of 'to' or 'check'")
const beat = z.union([z.string().min(1), z.strictObject({ if: conditionSchema, text: z.string().min(1) })])
export const sceneSchema = z
  .strictObject({
    id,
    text: z.union([z.string().min(1), z.array(beat).min(1)]),
    who: z.exactOptional(z.array(id).max(3)),
    place: z.exactOptional(id),
    mood: z.exactOptional(z.enum(['calm', 'tense', 'dread', 'warm', 'glitch'])),
    on: z.exactOptional(fx),
    choices: z.exactOptional(
      z.array(choiceSchema).min(1).max(4).refine((cs) => new Set(cs.map((c) => c.id)).size === cs.length, 'choice ids must be unique'),
    ),
    next: z.exactOptional(id),
    end: z.exactOptional(id),
    time: z.exactOptional(timeChange),
    tags: z.exactOptional(z.array(z.enum(['camp', 'gate', 'hub', 'echo']))),
    glitch: z.exactOptional(z.string().min(1)),
  })
  .refine((s) => [s.choices, s.next, s.end].filter((x) => x !== undefined).length === 1, "scene needs exactly one of 'choices', 'next' or 'end'")
export const scenesSchema = z.array(sceneSchema)
