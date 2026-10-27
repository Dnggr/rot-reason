// engine/stateSchema.ts — Zod schemas for runtime data: GameState and the save envelope (saves are validated on load, ARCHITECTURE §5.3)
import { z } from 'zod'
import { DEED_KEEP } from './deeds'
import { NAME_MAX } from './bounds'
import { SYS_ERROR } from './ids'
import { PARTY_MAX } from './relations'
import { healState } from './stateHeal'
import { refProblem } from './stateRefs'
import type { GameState, Story } from './types'
const id = z.string().min(1)
const int = z.number().int()
const within = (min: number, max: number) => int.min(min).max(max)
const name = z.string().min(1).max(NAME_MAX).refine((n) => n.trim() !== '', 'is blank') // the Background screen trims and caps names (and falls back to Ash); a save must not hold more (M3 s7, D35)
const npc = z.strictObject({ alive: z.boolean(), trust: within(-100, 100), fear: within(0, 100) })
const echo = z.strictObject({ scene: id, dueIn: z.exactOptional(within(0, 1000)), atChapter: z.exactOptional(id) })
const deed = z.strictObject({ tag: id, witnessed: z.boolean(), surfaced: z.boolean(), day: within(1, 21), delta: int, who: z.record(z.string(), int) })
const entry = z.strictObject({ n: int, kind: z.enum(['SCENE', 'CHOICE', 'FX', 'HONOR', 'SECRET', 'ECHO', 'ERROR', 'DEBUG']), text: z.string() })
export const gameStateSchema: z.ZodType<GameState> = z.strictObject({
  v: int, seed: int, rng: int, name, scene: id, chapter: id, day: within(1, 21),
  phase: z.enum(['dawn', 'day', 'dusk', 'night']),
  stats: z.strictObject({ hp: within(0, 5), reason: within(0, 100), rot: within(0, 100) }),
  res: z.strictObject({ food: within(0, 9), ammo: within(0, 9), meds: within(0, 9) }),
  attr: z.strictObject({ grit: within(0, 9), wits: within(0, 9), heart: within(0, 9) }),
  bg: id, traits: z.array(z.string()), honor: within(-100, 100), flags: z.record(z.string(), z.literal(true)),
  secrets: z.array(z.string()), owed: z.record(z.string(), int), owedTags: z.record(z.string(), z.array(z.string())), party: z.array(z.string()), met: z.array(z.string()), deeds: z.array(deed).max(DEED_KEEP), npc: z.record(z.string(), npc),
  echoes: z.array(echo), deedCount: z.record(z.string(), within(0, 1000)), history: z.array(z.string()),
  log: z.array(entry).max(200), resume: id.nullable(),
}).superRefine((s, ctx) => {
  // Who travels with you (D32): at most PARTY_MAX, no one twice, every one a living npc. `party` and `kill` keep this true; a hand-edited or corrupt save would not.
  const gone = s.party.find((p) => s.npc[p]?.alive !== true)
  const problem = s.party.length > PARTY_MAX ? `party has ${s.party.length} members (max ${PARTY_MAX})`
    : new Set(s.party).size !== s.party.length ? 'party lists someone twice'
    : gone !== undefined ? `party member ${gone} is not a living npc` : undefined
  if (problem !== undefined) ctx.addIssue({ code: 'custom', path: ['party'], message: problem })
})
// The save envelope, parsed loosely: snapshot and checkpoint are validated one by one so a bad snapshot can still fall back to replay.
export const saveHeadSchema = z.object({
  v: int, seed: int, bg: id, name, history: z.array(z.string()), savedAt: z.number().finite(),
  snapshot: z.unknown(), checkpoint: z.unknown(),
})
const shapeText = (e: z.ZodError): string => `${e.issues[0]?.path.join('.')} ${e.issues[0]?.message}`
// Why a state breaks the rules (shape and ranges, then every id it holds must exist in this story, D33, D34, engine/stateRefs.ts); undefined when it does not. Strict: the fuzz bot checks it every step.
export function stateProblem(raw: unknown, story: Story): string | undefined {
  const r = gameStateSchema.safeParse(raw)
  return r.success ? refProblem(r.data, story) : shapeText(r.error)
}
// A usable state: no problem above, and not parked on the error scene.
export function validState(raw: unknown, story: Story): GameState | undefined {
  const r = gameStateSchema.safeParse(raw)
  return r.success && r.data.scene !== SYS_ERROR && refProblem(r.data, story) === undefined ? r.data : undefined
}
// What a load may use: the state is healed first (D34: ids the story renamed or removed are filled or dropped, see stateHeal.ts), then it must pass every check of `validState`. Notes say what was repaired.
export function loadableState(raw: unknown, story: Story): { state: GameState; notes: string[] } | undefined {
  const r = gameStateSchema.safeParse(raw)
  if (!r.success || r.data.scene === SYS_ERROR) return undefined
  const healed = healState(r.data, story)
  return refProblem(healed.state, story) === undefined ? healed : undefined
}
// The reason `loadableState` said no, for the player's error list; a reference problem says the save may come from an older build.
export function loadProblem(raw: unknown, story: Story): string {
  const r = gameStateSchema.safeParse(raw)
  if (!r.success) return shapeText(r.error)
  if (r.data.scene === SYS_ERROR) return 'it was saved on the error scene'
  const why = refProblem(healState(r.data, story).state, story)
  return why === undefined ? 'unknown reason' : `${why} (this save may be from an older build of the story)`
}
