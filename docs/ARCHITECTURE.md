# ARCHITECTURE

Goals, in order: **works, easy to debug, small, clean.**

## 1. Layers (one-way dependencies)

```
story (data)  ->  engine (pure logic)  ->  ui (React)       debug/ may read all, nothing reads debug/
```

- `story` imports nothing but its own types.
- `engine` imports `story` types only. No DOM, no React, no `Date`, no `Math.random`, no storage (storage passed in as an interface). Story data tables (deeds, trait bonuses) are passed in by the caller, never imported (D14).
- `ui` calls `engine` through one hook (`useGame`). UI never mutates state, never reads story data directly except via selectors.

## 2. Folder structure

```
src/
  engine/
    types.ts        GameState, Action, SaveData, LogEntry, Scene, Choice, Effect, Condition types (live since M1 s1)
    schema.ts       Zod schemas for story data: Condition, Effect, Choice, Scene (live since M1 s1)
    reducer.ts      reduce(state, action, story) -> state   (the only state change path; never throws) (live since M1 s3)
    choose.ts       CHOOSE / CONTINUE: validate, tick, cost, check, fx, cap, time, advance (live since M1 s3)
    flow.ts         advance / enter: $resume, missing target, death, chapter change, echo take, `on` effects (live since M1 s3)
    init.ts         startGame(story, bg, name, seed), SAVE_VERSION (live since M1 s3)
    choices.ts      status(choice, state): hidden / locked / broke / open (live since M1 s3)
    ids.ts          SYS_* scene ids, RESUME, chapterOf, findScene (live since M1 s3)
    bounds.ts       clamp + the value ranges; throws on NaN/Infinity (live since M1 s2)
    conditions.ts   evaluate(cond, state) -> boolean (live since M1 s2)
    effects.ts      apply(effect, state, deeds) -> {state, log, owed?}; applyAll(list, state, deeds) (live since M1 s2)
    honor.ts        tierOf, applyDeed, capScene, surface (live since M1 s2)
    checks.ts       resolveCheck(attr, dc, state, traitBonus) -> {state, roll, bonus, total, pass, log} (live since M1 s2)
    echoes.ts       schedule, tick, due, take (live since M1 s2)
    endings.ts      resolveEnding(state, rules), AUTO / DEATH / SYS ending ids (live since M1 s3)
    rng.ts          seeded mulberry32, pure: `nextFloat(rng) -> {value, rng}`, `nextInt`, `d6`, `initRng(seed)` (live since M1 s1)
    save.ts         makeSave, migrate, replay, loadSave, readSave / writeSave (storage injected) (live since M1 s3)
    stateSchema.ts  Zod schema for GameState and the save envelope, validState (live since M1 s3)
    select.ts       view selectors: currentView(state, story) -> View (live since M1 s3)
    log.ts          LogLine, Applied, line, pushLog (200-entry ring buffer), formatEntry (live since M1 s2)
  story/
    index.ts        buildStory(scenes), loadStory(), TABLES (live since M1 s3)
    flags.ts  characters.ts  backgrounds.ts  endings.ts  system.ts   (live since M1 s3; items.ts and factions.ts come when a scene needs them)
    honor.ts        DEEDS table: tag -> delta (live since M1 s2)
    traits.ts       TRAIT_BONUS: trait -> check bonus per attribute (live since M1 s2)
    chapters/ ch0_prologue.ts  ch1_a.ts  ch1_b.ts  ...  index.ts (registry, lazy by chapter)
  ui/
    App.tsx  strings.ts
    screens/    Title  Background  Play  Camp  Journal  Ending  Settings
    components/ SceneView  ChoiceList  StatBar  HonorMeter  Toast  CharacterCard  ErrorFallback
    hooks/      useGame.ts  useSaves.ts
    styles/     tokens.css  base.css  play.css
  debug/        DebugPanel.tsx  report.ts
scripts/        lint-story.ts  fuzz.ts  rules-check.ts  docs-check.ts  pack.ts
tests/          engine/*.test.ts  golden/*.test.ts
```

## 3. State shape (single source of truth, JSON-serializable)

```
GameState {
  v: number                       // save schema version
  seed: number; rng: number       // seed + current rng state
  name: string                    // player name, set by START
  scene: string; chapter: string
  day: number; phase: 'dawn'|'day'|'dusk'|'night'
  stats: { hp, reason, rot }      res: { food, ammo, meds }
  attr: { grit, wits, heart }     bg: string; traits: string[]
  honor: number
  flags: Record<string, true>     secrets: string[]               // secret ids still held
  owed: Record<secretId, number>  // honor still owed when that secret surfaces (HONOR §3)
  party: string[]
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
  -> 2 echoes.tick, pay cost, resolveCheck (seeded), applyAll(choice fx + check branch fx) in order, schedule choice.echo
  -> 3 capScene (net honor change per scene within ±25), then the departing scene's `time`, then push history
  -> 4 advance: resolve `$resume` / missing target / hp 0 (-> sys.death); on a chapter change reset deedCount
       and fade fear by 5; echoes.take (a due echo replaces the target, `resume` remembers it); enter the scene:
       applyAll(`on`) under its own capScene, hp 0 check
  -> 5 pushLog; the UI autosaves (save.makeSave)
UI re-renders from select.currentView(state, story)
```
`chapter` is the chapter of the flow, not of `state.scene`: an echo scene from c4 shown during c2 leaves `chapter` at c2. CONTINUE (for `next` scenes) runs the same steps with no cost, check or fx. START builds the state (`init.startGame`) and enters `story.start`. LOAD restores a valid snapshot (`save.loadSave` does the replay and checkpoint fallbacks first). CAMP is a stub until M4.

Actions (typed in `engine/types.ts`): `START(bg,name,seed)`, `CHOOSE(choice)` where `choice` is the choice id `a`-`d`, `CONTINUE` (for `next` scenes), `CAMP(action)`, `LOAD(save)`. `DEBUG_*` actions (debug build only) arrive with the DebugPanel in M2.

## 5. Anti-bug rules

1. **One state-changing path** (`reduce`). Everything else is read-only.
2. **Deterministic.** Same `seed + history` gives the same game. Any bug is reproducible with a report.
3. **Validate at the edge.** Story validated with Zod at dev start and in `lint:story`; saves validated on load; actions validated in the reducer.
4. **Fail soft, never blank.** Missing scene -> `sys.missing` fallback scene plus log entry; a thrown error -> `sys.error` plus an ERROR entry; hp 0 -> `sys.death` (all three live in `story/system.ts`, ids in `engine/ids.ts`). Corrupt save -> offer "Restart chapter" or "New game". Never a white screen.
5. **Error boundary** wraps the app: shows "Something broke" + a button **Copy debug report**.
6. **Bounded values.** Everything is clamped in one function (`engine/bounds.ts`); NaN/Infinity throws (the reducer turns a throw into an ERROR log plus the fallback scene).
7. **Closed vocabularies.** Conditions/effects are tuples from a fixed list; unknown kinds are lint errors and runtime log errors.
8. **Small, pure files.** `npm run rules` fails on files > 200 lines (chapter files > 400), a missing first-line purpose comment, or `Math.random` / `Date` / DOM / React inside `src/engine` or `src/story`.
9. **Typed everything.** `strict`, `noUncheckedIndexedAccess`, no `any`.
10. **Tests where bugs hurt:** reducer, honor, conditions, checks, saves, endings. UI gets smoke tests only.
11. **Build gate.** `"build": "npm run check && vite build"`; a broken story or failing test blocks the Vercel deploy. (Live since M0.)
12. **Chapter checkpoints.** A snapshot is saved at each chapter gate. Replay failures fall back to the last checkpoint.
13. **Docs are part of the code.** Every change updates the docs it touches plus `HANDOFF.md` (START_HERE Rule 0), checked by `docs:check`.

## 6. Save system

- Key `rr_save_v1` (+ `rr_slot_1..3` later). Value: `{ v, seed, bg, name, history, snapshot, checkpoint, savedAt }` (`bg` and `name` let a replay start without a trusted snapshot, D19). `savedAt` comes from the storage layer; the engine has no clock.
- Load order (`save.loadSave`): migrate -> validate snapshot (`stateSchema`) -> if invalid, replay `seed + bg + name + history` -> if that fails, load the chapter checkpoint -> else a list of errors (the UI offers "Restart chapter" or "New game").
- `makeSave(state, checkpoint, story, savedAt)` moves the checkpoint to the current state whenever the scene is tagged `gate`. Never autosave a state parked on `sys.error`.
- Storage is injected as `KeyValueStore { getItem, setItem }`; `readSave` returns `undefined` when nothing is stored and an error result (never a throw) for bad JSON.
- Autosave after every choice (debounced). Manual slots later (M5).
- `migrate(v)` functions are small and tested with fixture saves.

## 7. Debug tooling (`?debug=1` or dev build)

- **DebugPanel:** current scene id, state tree, last 30 log lines, flags list.
- **Controls:** jump to scene, set stat/honor/res/flag, set seed, force check result (pass/fail), rewind last choice, advance day.
- **Copy debug report:** JSON with app version, seed, history, last 30 log lines, state, user note. Paste it into Claude with the files involved.
- **Console handle (dev only):** `window.__rr = { state, dispatch, story }`.
- **Log format (greppable):** `[012] SCENE c2.crypt | CHOICE b | FX honor mercy unseen -> +2 (h=14) | SECRET hart_wife | ECHO c4.hart_knows in 14`.

## 8. Tooling scripts

- `lint-story.ts` (CLI) + `lintCore/Graph/Refs/Walk.ts` (live since M1 s3): schema per scene, duplicate ids, missing targets, reachability, no path to an ending, `$resume` rules, ending ids, flag / character / deed tag / background references, plus style warnings (STORY_FORMAT §8). Exits non-zero on error; warnings are printed.
- `fuzz.ts` (CLI) + `fuzzRun.ts` (live since M1 s3): `npm run fuzz -- [runs=1000] [seed=1]` plays random games per background with a seeded bot. Fails on soft-locks (no enabled choice), loops (> 500 steps), invalid state (`gameStateSchema`), any ERROR log line, a fallback ending, or a replay of `seed + bg + name + history` that differs from the live run. Prints the failing `seed` and history. Endings never reached are printed as information (M6 turns that into a gate).
- Coverage: `npm run coverage` (`@vitest/coverage-v8`, D16) fails under 90% line coverage on `src/engine`.
- `rules-check.ts`: line limits, header-comment check, engine/story purity (golden rules 1 and 3), and fails if git tracks anything under `node_modules/` or `dist/` (`git ls-files`; skipped with a warning outside git; added M1 s1). Live since M0.
- `docs-check.ts`: "docs last" gate. Fails if code changed (src, scripts, tests, root config) but `docs/HANDOFF.md` did not; warns if only HANDOFF changed; and always checks that HANDOFF has a `Next pack: `npm run pack:<name>`` line whose npm script and `scripts/pack.ts` preset exist. Uses `git status` for the first check (skipped outside git). Run via `npm run ready`.
- `pack.ts`: repomix presets. Generic ones (map, docs, core, story, ui, bug, chapter) plus one task pack per upcoming session (`m1s1`...), created by the AI at the end of each session. Task packs always include `scripts/pack.ts`, `docs/REPOMIX.md`, `docs/ROADMAP.md` (the `PACKING` list). One place to edit what each pack includes.
- Golden tests: scripted choice lists per chapter assert expected gate scene and key flags.

## 9. UI rules

- Screens are components that take `view` + `dispatch` only. No game logic in components.
- Text is rendered from `view.text`; typewriter effect is cosmetic and skippable; the full text is in the DOM from the start (accessibility, tests).
- Styles in 3 CSS files with CSS variables; no CSS-in-JS, no utility framework (saves tokens and bundle).
- Images referenced by key from `place`/`who`; missing image -> placeholder, never an error.
- Lazy-load chapters (`import('./chapters/ch2')`); initial bundle target < 150 KB gzip.

## 10. Deploy (Vercel)

- Framework preset: Vite. Build `npm run build`, output `dist`. No server, no env vars.
- `main` = production, feature branches = preview deploys (playtest links).
- Add `vercel.json` only if SPA fallback is needed (single page, so likely not).

## 11. Versioning and conventions

- Commits: `feat(engine): ...`, `story(ch2): ...`, `fix(ui): ...`, `docs: ...`.
- Branch per task: `m1-reducer`, `story-ch2`. Merge when `npm run check` is green.
- Naming: files `camelCase.ts` (components `PascalCase.tsx`), ids `snake_case`, scene ids `chN.name`.
