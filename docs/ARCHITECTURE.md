# ARCHITECTURE

Goals, in order: **works, easy to debug, small, clean.**

## 1. Layers (one-way dependencies)

```
story (data)  ->  engine (pure logic)  ->  ui (React)       debug/ may read all; only main.tsx imports it (lazily), see below
```

- `story` imports nothing but its own types.
- `engine` imports `story` types only. No DOM, no React, no `Date`, no `Math.random`, no storage (storage passed in as an interface). Story data tables (deeds, trait bonuses) are passed in by the caller, never imported (D14).
- `ui` calls `engine` through one hook (`useGame`; `useStory` only loads the story). UI never mutates state, never reads story data directly except via selectors. The debug report builder is `engine/report.ts`, so the error boundary can use it without reading `debug/` (D21). `ui` never imports `debug/`: `main.tsx` loads the panel with a dynamic import in a dev build or with `?debug=1` and passes it to `<App debugPanel>` as a component; the contract is `ui/debugApi.ts` (D25).

## 2. Folder structure

```
src/
  engine/
    types.ts        GameState, LogEntry, DeedRecord, Scene, Choice, Effect, Condition types; `Social` (approval table + walk-out line), `perks` and `tiers` in StoryTables (live since M1 s1; Social, owedTags M3 s1; deeds, perks, tiers M3 s2); re-exports Action, DebugPatch, SaveData from actions.ts
    actions.ts      SaveData, DebugPatch, Action (split from types.ts to keep it under 200 lines) (live since M3 s2)
    schema.ts       Zod schemas for story data: Condition, Effect, Choice, Scene (live since M1 s1)
    reducer.ts      reduce(state, action, story) -> state   (the only state change path; never throws) (live since M1 s3)
    choose.ts       CHOOSE / CONTINUE: validate, tick, cost, check, fx, cap, time, advance (live since M1 s3)
    flow.ts         advance / enter: $resume, missing target, death, chapter change, echo take, `on` effects (live since M1 s3)
    init.ts         startGame(story, bg, name, seed) (throws on an unknown background or a name that is blank or over NAME_MAX, D35), SAVE_VERSION (4 since M3 s3) (live since M1 s3)
    choices.ts      status(choice, state): hidden / locked / broke / open (live since M1 s3)
    ids.ts          SYS_* scene ids, RESUME, chapterOf, findScene (live since M1 s3)
    bounds.ts       clamp + the value ranges, `PHASES` (the order of a day) and `NAME_MAX` (24); throws on NaN/Infinity (live since M1 s2; PHASES / NAME_MAX M3 s7)
    conditions.ts   evaluate(cond, state) -> boolean (live since M1 s2)
    effects.ts      apply(effect, state, deeds, social?) -> {state, log, owed?, deed?}; applyAll(list, state, deeds, social?): pairs unwitnessed deeds with the next `secret`, reveal makes the party react, ends with the walk-out check; `time` never runs backwards: a day before the current one, or an earlier phase on the same day, is an ERROR and changes nothing (live since M1 s2; social M3 s1; time M3 s6, D34, phase M3 s7, D35)
    deeds.ts        DEED_KEEP (20), addDeed, reactors, trimDeeds (gives the scene cap's correction back to the scene's deeds): the Journal's deed list (live since M3 s2, D30; trim M3 s3, D31)
    met.ts          meet, metIn: GameState.met, who the player has met (live since M3 s3, D31)
    journal.ts      journalOf(state, story) -> { deeds (newest first, with who reacted), people (party first; the party, the dead and anyone met, and anyone whose trust or fear rose) with their perk line }: the Journal's selector (live since M3 s2, D30)
    relations.ts    shift (trust / fear), party (join / leave; the dead cannot join and nobody who would walk out at once, D31), wouldLeave, react (companion approval of a deed), walkouts, NO_SOCIAL, PARTY_MAX; `shift` ignores the dead (live since M3 s1, D29)
    honor.ts        tierOf, applyDeed (returns the deed and its repeat factor), capScene, surface, repeatFactor, roundAway (live since M1 s2)
    migrations.ts   save upgrades, one function per version step: v1to2 adds `owedTags` (M3 s1), v2to3 adds `deeds` (M3 s2)
    checks.ts       resolveCheck(attr, dc, state, traitBonus, perks?) -> {state, roll, bonus, total, pass, log}; heldTraits(state, perks): the player's traits plus the perk trait of every living companion in the party, so a perk lasts exactly as long as the companion is with you (live since M1 s2; perks M3 s2, D30)
    echoes.ts       schedule (an identical pending echo, same scene and same countdown or chapter, is skipped with an ECHO line, D35), tick, due, take (live since M1 s2)
    endings.ts      resolveEnding(state, rules), AUTO / DEATH / SYS ending ids (live since M1 s3)
    rng.ts          seeded mulberry32, pure: `nextFloat(rng) -> {value, rng}`, `nextInt`, `d6`, `initRng(seed)` (live since M1 s1)
    save.ts         makeSave, migrate, replay, loadSave, readSave / writeSave (storage injected) (live since M1 s3)
    stateSchema.ts  Zod schema for GameState and the save envelope, validState (live since M1 s3); `name` is 1 to NAME_MAX characters and not blank, in the state and in the envelope (D35); the party must be at most PARTY_MAX, without repeats, all living npcs (D32). Every id the state holds must exist in the story: `validState(raw, story)` / `stateProblem(raw, story)` (strict, the fuzz bot's check) add `stateRefs.refProblem` (D33, D34). `loadableState(raw, story)` is what a load uses: it heals first (`stateHeal`), then applies the same check; `loadProblem` words why a load failed (D34)
    stateRefs.ts    refProblem(state, story): scene, echo and resume scenes, bg, flags (`story.flags`), chapter (an echo or sys scene may sit in another chapter, but it must exist), met, owed keys (held secrets only), secrets, npc table (exactly the story's npcs) (D33); and since M3 s6 (D34) an echo's `atChapter` (a chapter with a scene), a party member who was met, traits (known, no repeats: `knownTraits` = a background's trait, a `traitBonus` key or a `PERKS` trait), deed tags (or `unknown`) and the npcs in a deed's `who`, `deedCount` keys (deed tags), and the shape of every `history` entry (`scene:choice` or `scene:>`; the scene's existence is not checked, so a renamed scene does not strand a save). Returns the first problem as a sentence
    stateHeal.ts    healState(state, story) -> { state, notes }: a save from an older build keeps its run: an npc the story added is filled in from `story.npcs`, and an npc, flag, met entry, party member, echo (scene or chapter gone), deed record, deed count or trait the story no longer has is dropped; the same object back when nothing needs it. The scene, background and chapter are never healed (D34)
    select.ts       view selectors: currentView(state, story) -> View (`lines` = all text; `beats` = each line with its `say` speaker; each locked choice carries its `lock` condition), hudOf(state) -> Hud (live since M1 s3; lock and hudOf M2 s1; beats D28)
    log.ts          LogLine, Applied, line, pushLog (200-entry ring buffer), formatEntry (live since M1 s2)
    report.ts       buildReport, reportText: the debug report JSON, pure (live since M2 s1)
    debug.ts        debugJump, debugSet, debugRoll, rngForRoll: the DEBUG_* actions (live since M2 s2)
  story/
    index.ts        buildStory(scenes), loadStory(), TABLES (live since M1 s3)
    flags.ts  characters.ts  backgrounds.ts  endings.ts  system.ts   (live since M1 s3; items.ts and factions.ts come when a scene needs them)
    honor.ts        DEEDS table: tag -> delta (live since M1 s2)
    approval.ts     APPROVAL (companion x deed tag -> trust change, the HONOR §5 table at 5 per +) and SOCIAL (APPROVAL + the walk-out line: trust -30, held by fear 60) (live since M3 s1, D29)
    traits.ts       TRAIT_BONUS: trait -> check bonus per attribute (live since M1 s2); PERKS: companion id -> { trait, text } for the perks the engine applies (Brick, Juno; M3 s2, D30)
    tiers.ts        TIER_LINES: the line of the full-screen banner when honor enters a tier (M3 s2, D30)
    chapters/ prologue.ts  test.ts (until M4)  ch1_a.ts  ch1_b.ts  ...  index.ts (registry, lazy by chapter)
  ui/
    App.tsx         root: ErrorBoundary > story loading > Game (live since M2 s1)
    Game.tsx        picks the screen from useGame; playRoute -> fallback / ending / play
    strings.ts  lockReason.ts  toasts.ts  names.ts  storage.ts  version.ts
    settings.ts     Settings type, defaults, rr_settings_v1 read / write, applySettings (to <html>) (live since M2 s2)
    typewriter.ts   pure: MS_PER_CHAR, totalChars, tick, typing (waits under an overlay), splitLines    keys.ts  keyCommand: 1-4 / Space / J    vitals.ts  low HP / Reason thresholds
    turns.ts        pure: turnsOf(beats) -> Turn[] (a run of narration, or of one character's lines); ReadChunk (a scene already read; D28); scrollKey (what SceneView watches to scroll)
    tiers.ts        pure: tierBanner(prev, next, lines) -> the banner when honor entered a new tier, BANNER_MS (M3 s2, D30)
    debugApi.ts     DebugApi + DebugPanelComponent: what the game hands the debug panel
    screens/    TitleScreen  BackgroundScreen  PlayScreen  SettingsScreen  EndingScreen  JournalScreen (live; the Journal is drawn over PlayScreen)   Camp (later)
    components/ Backdrop  StatBar  HonorMeter  SceneView  Dock  Lines  ChoiceList  ChoiceButton  Toast  ReportButton  ErrorFallback  ErrorBoundary  CharacterCard  TierBanner  ConfirmButton (live); `ui/confirm.ts` (the two-tap rule: `step(armed, 'tap' | 'blur' | 'timeout')`, `ARM_MS` 4 s, D33), `ui/fallback.ts` (the error fallback's actions; `canRetry`: the death ending's Restart chapter)
    hooks/      useGame.ts  gameModel.ts (pure reducer, autosave, Continue, playRoute, rewind)  useStory.ts  useSettings.ts  useTypewriter.ts  useTurn.ts  useKeys.ts
    styles/     tokens.css  base.css  play.css  stage.css (backdrop, HUD, story, dock with portrait / spoken line / Choices panel, Title column; wide grid)  motion.css
  debug/        DebugPanel.tsx  StateView.tsx  Controls.tsx  forceRoll.ts  rrHandle.ts  debug.css   (live since M2 s2)
scripts/        lint-story.ts (+ lintCore / Graph / Refs / Walk / Party / Time / Tone / Build)  fuzz.ts (+ fuzzRun)  rules-check.ts  docs-check.ts  pack.ts
tests/          engine/*.test.ts  ui/*.test.ts  golden/*.test.ts
```

## 3. State shape (single source of truth, JSON-serializable)

```
GameState {
  v: number                       // save schema version
  seed: number; rng: number       // seed + current rng state
  name: string                    // player name, set by START: 1 to 24 characters, not blank (D35)
  scene: string; chapter: string
  day: number; phase: 'dawn'|'day'|'dusk'|'night'
  stats: { hp, reason, rot }      res: { food, ammo, meds }
  attr: { grit, wits, heart }     bg: string; traits: string[]
  honor: number
  flags: Record<string, true>     secrets: string[]               // secret ids still held
  owed: Record<secretId, number>  // honor still owed when that secret surfaces (HONOR §3)
  owedTags: Record<secretId, string[]> // the unwitnessed deed tags a secret hides: the party reacts to them on reveal (D29)
  party: string[]
  deeds: DeedRecord[]             // the last 20 deeds, oldest first: { tag, witnessed, surfaced, day, delta, who: {npc: trust change} } (D30)
  npc: Record<id, { alive, trust, fear }>
  echoes: { scene, dueIn?: number, atChapter?: string }[]
  deedCount: Record<tag, number>  // per chapter, for diminishing returns
  history: string[]               // "scene:choice" ("scene:>" for CONTINUE) list for replay
  log: LogEntry[]                 // ring buffer, last 200
  resume: string | null           // where an echo scene's `$resume` goes (D18)
}
```

No functions, no class instances, no Dates in state.

## 4. Data flow

```
UI click -> dispatch({type:'CHOOSE', choice}) -> reduce(state, action, story)
  -> 1 validate action against current scene: choice exists, `if` shown, `lock` true, cost affordable
       (stale clicks are ignored and logged as ERROR; they are not in history)
  -> 2 echoes.tick, pay cost, resolveCheck (seeded, with the perks of the party), applyAll(choice fx + check branch fx) in order (a witnessed deed also moves the trust of the companions in the party by the approval table; a `reveal` does the same for the deeds the secret hid; every deed and every surfaced deed is also recorded in `deeds`; the list ends with the walk-out check), schedule choice.echo
  -> 3 capScene (net honor change per scene within ±25), then the departing scene's `time`, then push history
  -> 4 advance: resolve `$resume` / missing target / hp 0 (-> sys.death); on a chapter change reset deedCount
       and fade fear by 5 (a companion that fear was holding may then walk out); echoes.take (a due echo replaces the target, `resume` remembers it); enter the scene:
       applyAll(`on`) under its own capScene, hp 0 check
  -> 5 pushLog; the UI autosaves (save.makeSave)
UI re-renders from select.currentView(state, story)
```
`chapter` is the chapter of the flow, not of `state.scene`: an echo scene from c4 shown during c2 leaves `chapter` at c2. CONTINUE (for `next` scenes) runs the same steps with no cost, check or fx. START builds the state (`init.startGame`) and enters `story.start`. LOAD restores a valid snapshot (`save.loadSave` does the replay and checkpoint fallbacks first). CAMP is a stub until M4.

Actions (typed in `engine/types.ts`): `START(bg,name,seed)`, `CHOOSE(choice)` where `choice` is the choice id `a`-`d`, `CONTINUE` (for `next` scenes), `CAMP(action)`, `LOAD(save)`. `DEBUG_JUMP(scene)`, `DEBUG_SET(patch)` and `DEBUG_ROLL(roll)` (live, `engine/debug.ts`) are engine actions for the debug panel: each logs a `DEBUG` line, bad input is refused with a `DEBUG` line (never a throw), and `uiReducer(story, debug)` drops them unless the panel is mounted. `DEBUG_REWIND` is a UI action (`gameModel.rewind`, it replays history, which the engine cannot import without a cycle). A jump or set leaves `history` alone, so an edited run no longer replays; saves then use the snapshot, and rewind refuses with a log line. `LogEntry.kind` gained `DEBUG` (the state schema accepts it).

## 5. Anti-bug rules

1. **One state-changing path** (`reduce`). Everything else is read-only.
2. **Deterministic.** Same `seed + history` gives the same game. Any bug is reproducible with a report.
3. **Validate at the edge.** Story validated with Zod at dev start and in `lint:story`; saves validated on load; actions validated in the reducer.
4. **Fail soft, never blank.** Missing scene -> `sys.missing` fallback scene plus log entry; a thrown error -> `sys.error` plus an ERROR entry; hp 0 -> `sys.death` (all three live in `story/system.ts`, ids in `engine/ids.ts`). Corrupt save -> offer "Restart chapter" or "New game". Never a white screen.
5. **Error boundary** wraps the app: shows "Something broke" + a button **Copy debug report** (live since M2 s1; if the clipboard is blocked the text is shown to copy by hand). A broken scene reaches `ErrorFallback` through `playRoute`, with Restart chapter when a checkpoint exists.
6. **Bounded values.** Everything is clamped in one function (`engine/bounds.ts`); NaN/Infinity throws (the reducer turns a throw into an ERROR log plus the fallback scene).
7. **Closed vocabularies.** Conditions/effects are tuples from a fixed list; unknown kinds are lint errors and runtime log errors.
8. **Small, pure files.** `npm run rules` fails on files > 200 lines (chapter files > 400), a missing first-line purpose comment, or `Math.random` / `Date` / DOM / React inside `src/engine` or `src/story`.
9. **Typed everything.** `strict`, `noUncheckedIndexedAccess`, no `any`.
10. **Tests where bugs hurt:** reducer, honor, conditions, checks, saves, endings. UI gets smoke tests only (`tests/ui`: pure UI logic plus `react-dom/server` render checks; no DOM library).
11. **Build gate.** `"build": "npm run check && vite build"`; a broken story or failing test blocks the Vercel deploy. (Live since M0.)
12. **Chapter checkpoints.** A snapshot is saved at each chapter gate. Replay failures fall back to the last checkpoint.
13. **Docs are part of the code.** Every change updates the docs it touches plus `HANDOFF.md` (START_HERE Rule 0), checked by `docs:check`.

## 6. Save system

- Key `rr_save_v1` (+ `rr_slot_1..3` later). Value: `{ v, seed, bg, name, history, snapshot, checkpoint, savedAt }` (`bg` and `name` let a replay start without a trusted snapshot, D19). `savedAt` comes from the storage layer; the engine has no clock.
- Load order (`save.loadSave`): migrate -> snapshot: heal it (`stateHeal`, D34: ids the story added, renamed or removed are filled or dropped; the result carries `healed`, one note per repair, and the same lines go to the log as FX), then validate it (`stateSchema` + `stateRefs`; a save whose scene, background or chapter the story lacks, or that breaks a rule healing does not touch, is invalid) -> if invalid, replay `seed + bg + name + history` -> if that fails, load the chapter checkpoint (healed the same way) -> else a list of errors that says why, e.g. "snapshot is invalid: scene c1.x is not in the story (this save may be from an older build of the story)" (the UI offers "Restart chapter" or "New game"). The UI does not show `healed` yet (HANDOFF known gaps).
- `makeSave(state, checkpoint, story, savedAt)` moves the checkpoint to the current state whenever the scene is tagged `gate`. Never autosave a state parked on `sys.error`.
- Storage is injected as `KeyValueStore { getItem, setItem }`; `readSave` returns `undefined` when nothing is stored and an error result (never a throw) for bad JSON.
- Autosave after every state change on the play screen (`useGame` effect -> `gameModel.autosave`; synchronous, no debounce, D21). A failed write shows a notice, never a throw. Continue reads the save with `readSave` on the title screen; an unreadable save shows a notice and New game. `ui/storage.ts` falls back to memory when localStorage is blocked, and the Title warns. Manual slots later (M5).
- `migrate(v)` functions are small and tested with fixture saves. `SAVE_VERSION` is 4 (M3 s3): `migrations.v1to2` gives a v1 snapshot and checkpoint an empty `owedTags` (a held secret from a v1 run pays its honor on reveal but causes no trust hit), `v2to3` an empty `deeds` (a v2 run has no record of its past deeds), and `v3to4` a `met` list that starts with the party (D31), so v1, v2 and v3 saves load.

## 7. Debug tooling (`?debug=1` or dev build)

- **DebugPanel (live):** a floating Debug button opens a bottom sheet: current scene, chapter, day, seed / rng, flags, secrets, party, echoes (with their countdown), the state tree, the last 30 log lines. Loaded lazily (own chunk).
- **Controls (live):** jump to any scene id; set hp / reason / rot / food / ammo / meds / honor / day to a number (clamped, rounded); set or clear a flag; Day +1; `rng seed` reseeds the roll stream (`state.rng`; `state.seed`, the start seed, stays so replays keep their meaning); Force pass / Force fail on a scene's check choices (`DEBUG_ROLL` makes the next d6 land on the face that gives that result, then picks the choice; `debug/forceRoll.ts` mirrors `resolveCheck`, tested against it); Rewind last step (only for an unedited run). Controls are off outside the play screen.
- **Copy debug report:** JSON with app version, seed, history, last 30 log lines, state, user note (the panel has a note box). Paste it into Claude with the files involved. A run edited with the controls shows `DEBUG` lines in its log.
- **Console handle:** `window.__rr = { state, dispatch, story }` while the panel is mounted (dev or `?debug=1`); `state` is read live; `dispatch` takes any UI action, including `DEBUG_*`.
- **Log format (greppable):** `[012] SCENE c2.crypt | CHOICE b | FX honor mercy unseen -> +2 (h=14) | SECRET hart_wife | ECHO c4.hart_knows in 14`.

## 8. Tooling scripts

- `lint-story.ts` (CLI) + `lintCore/Graph/Refs/Walk/Party/Lists/Time/Tone.ts` (live since M1 s3; `lintTime` M3 s6: a warning when a `time` day is earlier than one a route has already reached, judged per way out of a scene, and since M3 s7 (D35) the same for a phase earlier than the one reached on the same day; `lintLists` M3 s7: per effect list, an unwitnessed deed with no `secret` after it, the same echo twice, an echo `at` its own chapter; `lintTone` since the intro: no "zombie" / "undead" in story text, story-share warning): schema per scene, duplicate ids, missing targets, reachability, no path to an ending, `$resume` rules, ending ids, flag / character (`who`, `say`, conditions, effects) / deed tag / trait (`knownTraits`, M3 s6) / background references, an echo `at` a chapter no scene has (M3 s6), an echo whose target is not tagged `echo` (M3 s7), a `secret` condition no scene holds (warning, M3 s7), plus style warnings (STORY_FORMAT §8). Exits non-zero on error; warnings are printed.
- `fuzz.ts` (CLI) + `fuzzRun.ts` (live since M1 s3): `npm run fuzz -- [runs=1000] [seed=1]` plays random games per background with a seeded bot. Fails on soft-locks (no enabled choice), loops (> 500 steps), invalid state (`gameStateSchema`), any ERROR log line, a fallback ending, or a replay of `seed + bg + name + history` that differs from the live run. Prints the failing `seed` and history. Endings never reached are printed as information (M6 turns that into a gate).
- Coverage: `npm run coverage` (`@vitest/coverage-v8`, D16) fails under 90% line coverage on `src/engine`.
- `rules-check.ts`: line limits, header-comment check, engine/story purity (golden rules 1 and 3), and fails if git tracks anything under `node_modules/` or `dist/` (`git ls-files`; skipped with a warning outside git; added M1 s1). Live since M0.
- `docs-check.ts`: "docs last" gate. Fails if code changed (src, scripts, tests, root config) but `docs/HANDOFF.md` did not; warns if only HANDOFF changed; and always checks that HANDOFF has a `Next pack: `npm run pack:<name>`` line whose npm script and `scripts/pack.ts` preset exist. Uses `git status` for the first check (skipped outside git). Run via `npm run ready`.
- `pack.ts`: repomix presets. Generic ones (map, docs, core, story, ui, bug, chapter) plus one task pack per upcoming session (`m1s1`...), created by the AI at the end of each session. Task packs always include `scripts/pack.ts`, `docs/REPOMIX.md`, `docs/ROADMAP.md` (the `PACKING` list). One place to edit what each pack includes.
- Golden tests: scripted choice lists per chapter assert expected gate scene and key flags.

## 9. UI rules

- Screens are components that take `view` (+ `hud`) and callbacks only. No game logic in components. `useGame` holds `{ screen, game, checkpoint, toasts }` in one `useReducer` (`gameModel.uiReducer` wraps `reduce` and adds navigation); the boundary's report ref is the one read-only use of `GameState` outside the hook.
- Text is rendered from `view.beats` (`view.lines` is the same text without speakers); the scene is read turn by turn (`ui/turns.ts`, `useTurn`, D28); the typewriter effect is cosmetic and skippable; the full text of the turn being read is in the DOM from the start (accessibility, tests).
- Styles in 5 CSS files (tokens, base, play, stage, motion) plus `debug/debug.css` with the panel, all with CSS variables; no CSS-in-JS, no utility framework. Settings reach the page as `<html data-text="S|M|L|XL">` and the classes `hc`, `reduce-motion`, `soften` (`ui/settings.applySettings`); tokens and `motion.css` key off them. All animation is in `motion.css`.
- `PlayScreen` owns the turn (`useTurn`, restarted by `step` = scenes played), the typewriter (`useTypewriter`, restarted by each turn) and the keyboard (`useKeys` + `ui/keys.keyCommand`); a tap or key while text is typing only finishes it. The choices and their keys exist on the last turn only.
- Images referenced by key from `place` and the speaking character (`say`); missing image -> placeholder, never an error. `Backdrop` sets the CSS variable `--bg-img` to `url(/bg/<name>.webp)` (name stripped to letters, digits, `_`, `-`) over a gradient, so a missing file only leaves the gradient. `SceneView` renders as `display: contents` so its backdrop and story text are grid items of `.play`; `Dock` (portrait, spoken line, Choices panel) is its own grid item, rendered only while a character talks or choices are offered (`stage.css`).
- Overlays (M3 s2, D30): the Journal (`UiState.screen === 'journal'`) and the tier banner (`UiState.banner`, set by `uiReducer` from `ui/tiers.tierBanner`, cleared by `BANNER_OFF`, START, LOAD, rewind) are drawn by `PlayScreen` over the play page, which stays mounted (the scene being read keeps its turn) but is `inert` with its keys off while one is open. The Journal shows `engine/journal.journalOf`; nothing in `ui` reads story data directly.
- Lazy-load chapters (`import('./chapters/ch2')`); initial bundle target < 150 KB gzip.

## 10. Deploy (Vercel)

- Framework preset: Vite. Build `npm run build`, output `dist`. No server, no env vars.
- `main` = production, feature branches = preview deploys (playtest links).
- Add `vercel.json` only if SPA fallback is needed (single page, so likely not).

## 11. Versioning and conventions

- Commits: `feat(engine): ...`, `story(ch2): ...`, `fix(ui): ...`, `docs: ...`.
- Branch per task: `m1-reducer`, `story-ch2`. Merge when `npm run check` is green.
- Naming: files `camelCase.ts` (components `PascalCase.tsx`), ids `snake_case`, scene ids `chN.name`.
