// engine/stateSchema.ts — Zod schemas for runtime data: GameState and the save envelope (saves are validated on load, ARCHITECTURE §5.3)
import { z } from 'zod'
import { findScene, SYS_ERROR } from './ids'
import type { GameState, Story } from './types'
const id = z.string().min(1)
const int = z.number().int()
const within = (min: number, max: number) => int.min(min).max(max)
const npc = z.strictObject({ alive: z.boolean(), trust: within(-100, 100), fear: within(0, 100) })
const echo = z.strictObject({ scene: id, dueIn: z.exactOptional(within(0, 1000)), atChapter: z.exactOptional(id) })
const entry = z.strictObject({ n: int, kind: z.enum(['SCENE', 'CHOICE', 'FX', 'HONOR', 'SECRET', 'ECHO', 'ERROR']), text: z.string() })
export const gameStateSchema: z.ZodType<GameState> = z.strictObject({
  v: int, seed: int, rng: int, name: z.string(), scene: id, chapter: id, day: within(1, 21),
  phase: z.enum(['dawn', 'day', 'dusk', 'night']),
  stats: z.strictObject({ hp: within(0, 5), reason: within(0, 100), rot: within(0, 100) }),
  res: z.strictObject({ food: within(0, 9), ammo: within(0, 9), meds: within(0, 9) }),
  attr: z.strictObject({ grit: within(0, 9), wits: within(0, 9), heart: within(0, 9) }),
  bg: id, traits: z.array(z.string()), honor: within(-100, 100), flags: z.record(z.string(), z.literal(true)),
  secrets: z.array(z.string()), owed: z.record(z.string(), int), party: z.array(z.string()), npc: z.record(z.string(), npc),
  echoes: z.array(echo), deedCount: z.record(z.string(), within(0, 1000)), history: z.array(z.string()),
  log: z.array(entry).max(200), resume: id.nullable(),
})
// The save envelope, parsed loosely: snapshot and checkpoint are validated one by one so a bad snapshot can still fall back to replay.
export const saveHeadSchema = z.object({
  v: int, seed: int, bg: id, name: z.string(), history: z.array(z.string()), savedAt: z.number().finite(),
  snapshot: z.unknown(), checkpoint: z.unknown(),
})
// A usable state: valid shape and ranges, a scene that exists in this story, and not parked on the error scene.
export function validState(raw: unknown, story: Story): GameState | undefined {
  const r = gameStateSchema.safeParse(raw)
  if (!r.success || r.data.scene === SYS_ERROR || findScene(story, r.data.scene) === undefined) return undefined
  return r.data
}
