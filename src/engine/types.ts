// engine/types.ts — shared types: story data (Scene, Choice, Effect, Condition, Story) and runtime (GameState, Action, SaveData)
export type SceneId = string
export type ChoiceId = 'a' | 'b' | 'c' | 'd'
export type Phase = 'dawn' | 'day' | 'dusk' | 'night'
export type StatKey = 'hp' | 'reason' | 'rot'
export type ResKey = 'food' | 'ammo' | 'meds'
export type AttrKey = 'grit' | 'wits' | 'heart'
export type Tier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5'
export type Cmp = '>=' | '<=' | '>' | '<' | '=='
export type Mood = 'calm' | 'tense' | 'dread' | 'warm' | 'glitch'
export type Tone = 'mercy' | 'lie' | 'threaten' | 'brave' | 'quiet' | 'honest' | 'cold'
export type SceneTag = 'camp' | 'gate' | 'hub' | 'echo'
// ---- Conditions (STORY_FORMAT §4): closed vocabulary, tuples combinable with all / any / not ----
export type Condition =
  | readonly ['flag', string]
  | readonly ['honor', Cmp, number]
  | readonly ['tier', Cmp, Tier]
  | readonly ['res', ResKey, Cmp, number]
  | readonly ['stat', StatKey, Cmp, number]
  | readonly ['attr', AttrKey, Cmp, number]
  | readonly ['trait', string]
  | readonly ['alive', string]
  | readonly ['party', string]
  | readonly ['trust', string, Cmp, number]
  | readonly ['fear', string, Cmp, number]
  | readonly ['bg', string]
  | readonly ['day', Cmp, number]
  | readonly ['secret', string]
  | { readonly all: readonly Condition[] }
  | { readonly any: readonly Condition[] }
  | { readonly not: Condition }
// ---- Effects (STORY_FORMAT §5): closed vocabulary ----
export interface EchoSpec {
  scene: SceneId
  after?: number // after N scenes
  at?: string // at the start of this chapter
}
export interface TimeChange {
  day?: number
  phase?: Phase
}
export type Effect =
  | readonly ['honor', string, boolean] // deed tag, witnessed
  | readonly ['stat', StatKey, number]
  | readonly ['res', ResKey, number]
  | readonly ['set', string]
  | readonly ['clear', string]
  | readonly ['trust', string, number]
  | readonly ['fear', string, number]
  | readonly ['party', string] // '+id' joins, '-id' leaves
  | readonly ['kill', string]
  | readonly ['trait', string] // '+Name' gains, '-Name' loses
  | readonly ['secret', string]
  | readonly ['reveal', string]
  | readonly ['echo', EchoSpec]
  | readonly ['time', TimeChange]
// ---- Scene (STORY_FORMAT §2, §3) ----
export type Beat =
  | string
  | { readonly if: Condition; readonly text: string }
  | { readonly say: string; readonly text: string; readonly if?: Condition } // a line spoken by the character `say` (STORY_FORMAT §2, UI_UX §3)
export interface CheckBranch {
  fx?: readonly Effect[]
  to: SceneId
}
export interface Check {
  attr: AttrKey
  dc: number
  pass: CheckBranch
  fail: CheckBranch
}
export interface Choice {
  id: ChoiceId
  text: string
  tone?: Tone
  if?: Condition
  lock?: Condition
  cost?: Partial<Record<ResKey, number>>
  fx?: readonly Effect[]
  check?: Check
  to?: SceneId
  echo?: EchoSpec
}
export interface Scene {
  id: SceneId
  text: string | readonly Beat[]
  who?: readonly string[]
  place?: string
  mood?: Mood
  on?: readonly Effect[]
  choices?: readonly Choice[]
  next?: SceneId
  end?: string
  time?: TimeChange
  tags?: readonly SceneTag[]
  glitch?: string
}
// ---- Injected story data tables (src/story/honor.ts, src/story/traits.ts); the engine never imports story data ----
export type DeedTable = Readonly<Record<string, number>> // deed tag -> honor delta
export type TraitBonuses = Readonly<Record<string, Partial<Record<AttrKey, number>>>> // trait -> check bonus per attribute
// ---- Story tables and the assembled Story (M1 s3, D16); built by src/story/index.ts, passed into reduce / currentView ----
export interface Background {
  name: string
  attr: Record<AttrKey, number>
  trait: string
  stats: Record<StatKey, number>
  res: Record<ResKey, number> // starting kit
  hook?: string // one line for the Background screen (CHARACTERS.md "Unique hook")
}
export interface NpcStart { name: string; trust: number; fear: number }
export interface EndingRule {
  id: string
  if?: Condition // no condition = always matches (the last rule)
}
// Companion approval (HONOR §5, D29): npc id -> deed tag -> trust change, and when a companion walks out (trust at or below `leaveTrust` and fear under `fearHolds`).
export type ApprovalTable = Readonly<Record<string, Readonly<Record<string, number>>>>
export interface Social { approval: ApprovalTable; leaveTrust: number; fearHolds: number }
export interface StoryTables {
  start: SceneId
  deeds: DeedTable
  traitBonus: TraitBonuses
  backgrounds: Readonly<Record<string, Background>>
  npcs: Readonly<Record<string, NpcStart>>
  endings: readonly EndingRule[] // first match wins
  social: Social
}
export interface Story extends StoryTables {
  scenes: Readonly<Record<SceneId, Scene>>
}
// ---- Runtime (ARCHITECTURE §3, §4, §6): JSON-serializable, no functions, no class instances ----
export interface NpcState { alive: boolean; trust: number; fear: number }
export interface EchoEntry {
  scene: SceneId
  dueIn?: number
  atChapter?: string
}
export interface LogEntry {
  n: number
  kind: 'SCENE' | 'CHOICE' | 'FX' | 'HONOR' | 'SECRET' | 'ECHO' | 'ERROR' | 'DEBUG'
  text: string
}
export interface GameState {
  v: number // save schema version
  seed: number
  rng: number // current rng state (engine/rng.ts)
  name: string
  scene: SceneId
  chapter: string
  day: number
  phase: Phase
  stats: Record<StatKey, number>
  res: Record<ResKey, number>
  attr: Record<AttrKey, number>
  bg: string
  traits: string[]
  honor: number
  flags: Record<string, true>
  secrets: string[] // secret ids still held (not yet revealed)
  owed: Record<string, number> // secret id -> honor still owed when it surfaces (HONOR §3 witness rule)
  owedTags: Record<string, string[]> // secret id -> the unwitnessed deed tags it hides: the party reacts to them when it surfaces (D29)
  party: string[]
  npc: Record<string, NpcState>
  echoes: EchoEntry[]
  deedCount: Record<string, number> // per chapter, for diminishing returns
  history: string[] // "scene:choice" list for replay
  log: LogEntry[] // ring buffer, last 200
  resume: SceneId | null // where to go when an echo scene ends with '$resume' (flow.advance)
}
export interface SaveData {
  v: number
  seed: number
  bg: string // seed + bg + name + history is enough to replay the game when the snapshot is unusable
  name: string
  history: string[]
  snapshot: GameState
  checkpoint: GameState | null
  savedAt: number // epoch ms, supplied by the storage layer (the engine has no clock)
}
// A DEBUG_SET payload (engine/debug.ts): set one value to an exact number, or switch one flag. Debug build only.
export type DebugPatch =
  | { kind: 'stat'; key: StatKey; value: number }
  | { kind: 'res'; key: ResKey; value: number }
  | { kind: 'honor'; value: number }
  | { kind: 'day'; value: number }
  | { kind: 'rng'; value: number } // reseeds the roll stream (state.rng); state.seed, the start seed, is left alone
  | { kind: 'flag'; key: string; on: boolean }
export type Action =
  | { type: 'START'; bg: string; name: string; seed: number }
  | { type: 'CHOOSE'; choice: ChoiceId }
  | { type: 'CONTINUE' }
  | { type: 'CAMP'; action: string }
  | { type: 'LOAD'; save: SaveData }
  | { type: 'DEBUG_JUMP'; scene: SceneId } // debug build only (the UI drops these otherwise): enter any scene
  | { type: 'DEBUG_SET'; patch: DebugPatch }
  | { type: 'DEBUG_ROLL'; roll: number } // the next d6 lands on `roll` (1-6)
