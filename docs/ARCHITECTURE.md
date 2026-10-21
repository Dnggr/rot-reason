# ARCHITECTURE

Goals, in order: **works, easy to debug, small, clean.**

## 1. Layers (one-way dependencies)
```
story (data)  ->  engine (pure logic)  ->  ui (React)       debug/ may read all, nothing reads debug/
```
- `story` imports nothing but its own types.
- `engine` imports `story` types only. No DOM, no React, no `Date`, no `Math.random`, no storage (storage passed in as an interface).
- `ui` calls `engine` through one hook (`useGame`). UI never mutates state, never reads story data directly except via selectors.

## 2. Folder structure
```
src/
  engine/
    types.ts        GameState, Action, Scene, Effect, Condition types
    schema.ts       Zod schemas for story data (M1; add `zod` then)
    reducer.ts      reduce(state, action, story) -> state   (the only state change path)
    conditions.ts   evaluate(cond, state) -> boolean
    effects.ts      apply(effect, state) -> {state, log}
    honor.ts        applyDeed, tierOf, secrets surfacing
    checks.ts       resolveCheck(attr, dc, state, rng)
    echoes.ts       schedule, due
    endings.ts      resolveEnding(state, rules)
    rng.ts          seeded RNG (mulberry32), pure
    save.ts         serialize, migrate, replay (storage injected)
    select.ts       view selectors: currentView(state, story)
    log.ts          typed log entries
  story/
    flags.ts  characters.ts  items.ts  factions.ts  backgrounds.ts  honor.ts  endings.ts
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
  scene: string; chapter: string
  day: number; phase: 'dawn'|'day'|'dusk'|'night'
  stats: { hp, reason, rot }      res: { food, ammo, meds }
  attr: { grit, wits, heart }     bg: string; traits: string[]
  honor: number
  flags: Record<string, true>     secrets: string[]
  party: string[]
  npc: Record<id, { alive, trust, fear }>
  echoes: { scene, dueIn?: number, atChapter?: string }[]
  deedCount: Record<tag, number>  // per chapter, for diminishing returns
  history: string[]               // "scene:choice" list for replay
  log: LogEntry[]                 // ring buffer, last 200
}
```
No functions, no class instances, no Dates in state.

## 4. Data flow
```
UI click -> dispatch({type:'CHOOSE', choice}) -> reduce(state, action, story)
  -> 1 validate action against current scene (stale clicks ignored + logged)
  -> 2 pay cost, resolve check (seeded), apply fx in order
  -> 3 apply honor/secrets, advance time, schedule/consume echoes
  -> 4 pick next scene (echo due? else choice.to), apply `on`
  -> 5 push history + log, autosave
UI re-renders from select.currentView(state)
```
Actions: `START(bg,name,seed)`, `CHOOSE(choiceId)`, `CONTINUE` (for `next` scenes), `CAMP(action)`, `LOAD(save)`, `DEBUG_*` (debug build only).

## 5. Anti-bug rules
1. **One state-changing path** (`reduce`). Everything else is read-only.
2. **Deterministic.** Same `seed + history` gives the same game. Any bug is reproducible with a report.
3. **Validate at the edge.** Story validated with Zod at dev start and in `lint:story`; saves validated on load; actions validated in the reducer.
4. **Fail soft, never blank.** Missing scene -> `sys.missing` fallback scene plus log entry. Corrupt save -> offer "Restart chapter" or "New game". Never a white screen.
5. **Error boundary** wraps the app: shows "Something broke" + a button **Copy debug report**.
6. **Bounded values.** Stats clamped in one function; NaN guard throws in dev.
7. **Closed vocabularies.** Conditions/effects are tuples from a fixed list; unknown kinds are lint errors and runtime log errors.
8. **Small, pure files.** `npm run rules` fails on files > 200 lines (chapter files > 400), a missing first-line purpose comment, or `Math.random` / `Date` / DOM / React inside `src/engine` or `src/story`.
9. **Typed everything.** `strict`, `noUncheckedIndexedAccess`, no `any`.
10. **Tests where bugs hurt:** reducer, honor, conditions, checks, saves, endings. UI gets smoke tests only.
11. **Build gate.** `"build": "npm run check && vite build"`; a broken story or failing test blocks the Vercel deploy. (Live since M0.)
12. **Chapter checkpoints.** A snapshot is saved at each chapter gate. Replay failures fall back to the last checkpoint.
13. **Docs are part of the code.** Every change updates the docs it touches plus `HANDOFF.md` (START_HERE Rule 0), checked by `docs:check`.

## 6. Save system
- Key `rr_save_v1` (+ `rr_slot_1..3` later). Value: `{ v, seed, history, snapshot, checkpoint, savedAt }`.
- Load order: validate snapshot -> if invalid, replay `seed + history` -> if that fails, load chapter checkpoint -> else new game.
- Autosave after every choice (debounced). Manual slots later (M5).
- `migrate(v)` functions are small and tested with fixture saves.

## 7. Debug tooling (`?debug=1` or dev build)
- **DebugPanel:** current scene id, state tree, last 30 log lines, flags list.
- **Controls:** jump to scene, set stat/honor/res/flag, set seed, force check result (pass/fail), rewind last choice, advance day.
- **Copy debug report:** JSON with app version, seed, history, last 30 log lines, state, user note. Paste it into Claude with the files involved.
- **Console handle (dev only):** `window.__rr = { state, dispatch, story }`.
- **Log format (greppable):** `[012] SCENE c2.crypt | CHOICE b | FX honor mercy unseen -> +2 (h=14) | SECRET hart_wife | ECHO c4.hart_knows in 14`.

## 8. Tooling scripts
- `lint-story.ts`: loads all chapters, runs schema and graph checks (reachability, dead ends, flag usage). Exits non-zero on error.
- `fuzz.ts`: runs N random playthroughs per background with seeded RNG and random choices. Reports soft-locks (no available choices), loops (> 500 steps), invalid state (NaN, out-of-range), unreachable endings. Prints the failing `seed` and path so you can replay it in the debug panel.
- `rules-check.ts`: line limits, header-comment check, engine/story purity (golden rules 1 and 3). Live since M0.
- `docs-check.ts`: "docs last" gate. Fails if code changed (src, scripts, tests, root config) but `docs/HANDOFF.md` did not. Warns if only HANDOFF changed. Uses `git status`; skipped outside a git repo. Run via `npm run ready`.
- `pack.ts`: repomix presets (map, docs, core, story, ui, bug, chapter). One place to edit what each pack includes.
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
