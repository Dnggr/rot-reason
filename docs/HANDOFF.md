# HANDOFF (living log; update at the end of every session)

## Status

- **Phase:** M1 (engine core) DONE. Sessions 1-3 complete. Next: M2 session 1 (UI shell part 1).
- **Deployed:** https://rotandreason.vercel.app/ (Vercel, auto-deploys on push to `main`; build runs `npm run build` = `check` + `vite build`). Nothing user-visible changed: the UI is still the M0 placeholder.
- **Last verified:** in a repo rebuilt from the pack on Node 22.22: `npm run check` green (typecheck, lint:story 5 scenes 0 errors 0 warnings, 197 tests, rules), `npm run coverage` 100% lines on `src/engine`, `npm run fuzz` 1,000 runs 0 failures (seeds 1 and 99). `docs:check` was run against a throwaway git repo: run `npm run ready` once locally. **Run `npm install`** (new devDependency, so `package-lock.json` changes; commit it).

## This session (M1 s3: reducer, saves, test story, lint, fuzz)

- `src/engine/`: `reducer` (START, CHOOSE, CONTINUE, LOAD; CAMP stub), `choose`, `flow`, `init`, `choices`, `ids`, `select` (`currentView` -> `View`), `endings`, `save`, `stateSchema`; `checks.checkOdds`. `types.ts`: `Story`, `StoryTables`, `Background`, `NpcStart`, `EndingRule`, `GameState.resume`, `SaveData.bg/name`.
- `src/story/`: `index` (`buildStory`, `loadStory`), `backgrounds`, `characters`, `flags`, `endings`, `system`, `chapters/test.ts` (5 scenes, all 14 effect kinds; registered as chapter `test`, start scene `t.wake`).
- Scripts: `lint-story` is real (`lintCore/Graph/Refs/Walk`); `fuzz` is real (`fuzzRun`); `pack.ts` has `m2s1`, task packs `m1s1`-`m1s3` deleted (M1 done); `package.json`: `coverage`, `pack:m2s1`, `@vitest/coverage-v8`; `vite.config.ts`: coverage thresholds.
- Tests: reducer, select (+ odds, endings), save, lint, fuzz, story (golden paths) added; `fixtures.ts` + `types.test.ts` gained `resume` / `bg` / `name`.
- Docs updated: START_HERE, ARCHITECTURE, STORY_FORMAT (flow rules, §8 linter), HONOR, GAME_DESIGN, STORYBOARD, UI_UX, README, ROADMAP (M1 done, D16-D19), HANDOFF.

## Decisions made

- D16 coverage provider; D17 `Story` shape and `sys.*` scenes; D18 `resume` + `$resume` for echoes; D19 save carries `bg` and `name`. Earlier: D1-D15.

## Assumptions to confirm (small, easy to change; details in STORY_FORMAT §2, §5)

- From s1/s2, still open: `GameState.name`; `LogEntry` shape; `all`/`any`/`not`; `CHOOSE` carries the choice id; `lock` has no reason text; new deed tag `lie_harm`; owed remainder pairing (D15); echo `after: N` = N scenes play then it fires.
- New: `scene.time` applies when the player LEAVES the scene; `glitch` replaces `text` when Reason < 30; start stats hp 5 / reason 80 / rot 0 (in `backgrounds.ts`); a due echo may fire before an ending; `end: 'auto'` runs the resolver; endings E5/E6 swapped in data so the default is last; `reduce` START ignores its `state` argument (the UI can pass any placeholder).
- Starting kit items (crowbar, toolkit) are not modelled; only resources.

## Story changes

- Test chapter `t.*` (wake, street, gate, echo, end) is placeholder content in the live registry. Delete it and set `START_SCENE` in `story/index.ts` when M4 writes the Prologue.

## Known bugs

- none

## Known gaps

- `ChoiceView` has `why: 'lock'` but no reason text (UI_UX §5 wants "Needs Medic"). Decide in M2: derive from the condition, or add an authored field.
- `CAMP` is a stub (M4). Companion approval table, trust hit on `reveal`, Rot/Reason mechanics are M3/M5. Fuzz lists endings never reached as information only (gate in M6).
- Debug-only actions (`DEBUG_*`) and the `useGame` / `useSaves` hooks do not exist yet (M2).

## Environment

- Node >= 22.12 (`nvm install 22 && nvm use 22`, then `npm install`). Vercel builds on Node 22. Push over SSH (`git@github.com:Dnggr/rot-reason.git`).

## Next 3 tasks (M2 session 1: UI shell part 1)

Next pack: `npm run pack:m2s1`

1. `useGame` hook (`loadStory`, `useReducer(reduce)`, autosave via `makeSave` / `writeSave`, Continue via `readSave`), Title and Background screens (name + 3 background cards from `BACKGROUNDS`).
2. Play screen: `SceneView`, `ChoiceList` / `ChoiceButton` (tone, cost chips, odds word, locked reason), `StatBar`, `HonorMeter` (`tierOf`), `Toast`; ending screen from `view.ending`.
3. `ErrorFallback` for `view.kind === 'error'` / ending `sys_error` plus the error boundary with Copy debug report; settle the lock-reason question above. Then create the next pack (`m2s2`) and update HANDOFF (Rule 0).

## Verify

`npm install && npm run ready && npm run coverage && npm run fuzz`

## Archive

<!-- older sessions go here; keep out of packs -->

- M0 (scaffold): Vite + React + TS strict scaffold, scripts, repomix config and presets, Rule 0 / 0.5 (D7-D11), Vercel deploy, Node >= 22.12 fix.
- M1 s1 (foundations): `types`, `schema` (Zod, D12), `rng`, `rules-check` guard for tracked `node_modules/` / `dist/`, `PACKING` list (D13), 56 tests.
- M1 s2 (rules pieces): `log`, `bounds`, `conditions`, `effects`, `honor`, `checks`, `echoes`, `story/honor.ts`, `story/traits.ts`; D14, D15; 117 tests, 100% engine lines.
