// engine/migrations.ts — save upgrades, one small function per version step; save.ts lists them in MIGRATIONS (ARCHITECTURE §6)
const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
// v1 -> v2 (M3 s1, D29): GameState gains `owedTags`. A v1 run knows no deed tags for its held secrets, so it starts empty (a later reveal still pays its honor, with no trust hit).
const upState = (x: unknown): unknown => (isRecord(x) ? { ...x, v: 2, owedTags: {} } : x)
export const v1to2 = (raw: Record<string, unknown>): Record<string, unknown> => ({ ...raw, snapshot: upState(raw['snapshot']), checkpoint: upState(raw['checkpoint']) })
// v2 -> v3 (M3 s2, D30): GameState gains `deeds`, the Journal's list. A v2 run has no record of its past deeds, so the list starts empty.
const upState3 = (x: unknown): unknown => (isRecord(x) ? { ...x, v: 3, deeds: [] } : x)
export const v2to3 = (raw: Record<string, unknown>): Record<string, unknown> => ({ ...raw, snapshot: upState3(raw['snapshot']), checkpoint: upState3(raw['checkpoint']) })
// v3 -> v4 (M3 s3, D31): GameState gains `met`, who the player has met. A v3 run knows only who travels with you, so the list starts with the party (anyone else shows once their numbers move, as before).
const upState4 = (x: unknown): unknown => (isRecord(x) ? { ...x, v: 4, met: Array.isArray(x['party']) ? x['party'].filter((id): id is string => typeof id === 'string') : [] } : x)
export const v3to4 = (raw: Record<string, unknown>): Record<string, unknown> => ({ ...raw, snapshot: upState4(raw['snapshot']), checkpoint: upState4(raw['checkpoint']) })
