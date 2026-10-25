// engine/migrations.ts — save upgrades, one small function per version step; save.ts lists them in MIGRATIONS (ARCHITECTURE §6)
const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
// v1 -> v2 (M3 s1, D29): GameState gains `owedTags`. A v1 run knows no deed tags for its held secrets, so it starts empty (a later reveal still pays its honor, with no trust hit).
const upState = (x: unknown): unknown => (isRecord(x) ? { ...x, v: 2, owedTags: {} } : x)
export const v1to2 = (raw: Record<string, unknown>): Record<string, unknown> => ({ ...raw, snapshot: upState(raw['snapshot']), checkpoint: upState(raw['checkpoint']) })
