# HANDOFF (living log; update at the end of every session)

## Status

- **Phase:** M2 (UI shell) session 1 of 2 DONE. Next: M2 session 2 (Settings, keyboard + typewriter, DebugPanel).
- **Deployed:** https://rotandreason.vercel.app/ (auto-deploys on push to `main`; build runs `npm run build`). After this push the live page is the playable test story: Title, Background, Play, Ending. Not pushed or checked on a phone yet.
- **Last verified:** in a repo rebuilt from the pack on Node 22.22: `npm run ready` green (typecheck, lint:story 5 scenes 0 errors 0 warnings, 267 tests, rules 98 files, docs:check run in a throwaway git repo), `npm run coverage` 100% lines on `src/engine`, `npm run fuzz` 1,000 runs 0 failures (seeds 1 and 99), `npm run build` ok (JS 107 KB gzip, target 150). A throwaway jsdom click-through of the real `<App />` also passed (new game to ending, autosave, Continue after reload, broken save, blocked storage, error boundary, Copy report both paths); jsdom was removed again, so no phone or real-browser check exists yet: do it on the Vercel preview. No dependency changes.

## This session (M2 s1: UI shell part 1)

- Engine: `select.ts` (`ChoiceView.lock` condition, `hudOf` -> `Hud`), new `report.ts` (`buildReport`, `reportText`), `Background.hook?` (types) with one line per background in `story/backgrounds.ts`.
- UI: `App` (ErrorBoundary > `useStory` > `Game`), `Game` (screen router, `playRoute`), `strings`, `lockReason`, `toasts`, `names`, `storage`, `version`; `hooks/useGame` + `gameModel` (pure `uiReducer`, `autosave`, `savedGame`) + `useStory`; screens Title, Background, Play, Ending; components StatBar, HonorMeter, SceneView, ChoiceList, ChoiceButton, Toast, ReportButton, ErrorFallback, ErrorBoundary; `styles/play.css`, `--border` token.
- Tests (+70): `tests/ui/*` (gameModel, lockReason, toasts, storage, render), `tests/engine/report.test.ts`, select tests for `lock` and `hudOf`.
- Docs updated: START_HERE, ARCHITECTURE, UI_UX, STORY_FORMAT, CHARACTERS, STORYBOARD, ROADMAP (M2 s1 ticked, D20, D21), README, HANDOFF. Pack: `m2s2` added; `m2s1` stays until M2 is done.

## Decisions made

- D20 lock reason derived in the UI from the condition (no authored field); D21 one `useGame` hook, synchronous autosave, report builder in the engine. Earlier: D1-D19.

## Assumptions to confirm (small, easy to change)

- Still open from M1 (STORY_FORMAT §2, §5): `GameState.name`; `LogEntry` shape; `all`/`any`/`not`; `CHOOSE` carries the choice id; new deed tag `lie_harm`; owed remainder pairing (D15); echo `after: N`; `scene.time` applies when the player leaves; `glitch` replaces `text` when Reason < 30; start stats hp 5 / reason 80 / rot 0; a due echo may fire before an ending; endings E5/E6 order; `reduce` START ignores its `state`; starting kit items are not modelled.
- New: ending titles are UI labels in `ui/strings.ts` (`endings`, from STORYBOARD §4), to move into `src/story` when companion epilogues need authored text (M6). NPC display names are the capitalised id (`ui/names.ts`). Autosave covers every state except `sys.error`, an ending included, so Continue reopens the ending. New game over a save needs a second tap; the old save is replaced at the first autosave after Begin. Toasts omit the deed tag (the diff has none). Continue shows the raw chapter id until chapter titles exist (M4). The default name is "Ash" (CHARACTERS).

## Known bugs

- none

## Known gaps

- M2 s2: Settings, keyboard (`1-4`, `Space`, `J`), typewriter, low-HP / low-Reason visuals, DebugPanel, `DEBUG_*` actions, `window.__rr`, `?debug=1`. The Play screen has a single Menu button (back to title) instead of the Journal / Party / Menu bar.
- M3+: Journal, Party cards, TierBanner, check fail-cost hint line (needs data in `ChoiceView`), confirm step for irreversible choices (needs a scene flag). `CAMP` is a stub (M4). Restart chapter appears only once a gate scene was reached or a save with a checkpoint was loaded.

## Environment

- Node >= 22.12 (`nvm install 22 && nvm use 22`, then `npm install`). Vercel builds on Node 22. Push over SSH (`git@github.com:Dnggr/rot-reason.git`).

## Next 3 tasks (M2 session 2: UI shell part 2)

Next pack: `npm run pack:m2s2`

1. Settings screen and store (text size S/M/L/XL, soften violence, reduced motion, high contrast, sound, reset save) applied through CSS classes and tokens; Title gets a Settings button.
2. Keyboard (`1-4`, `Space`, `J`) and typewriter text (rAF, skippable, off with reduced motion); low-HP / low-Reason visuals if cheap.
3. DebugPanel (`?debug=1` or dev): state, last 30 log lines, flags, jump / set / force-check / rewind through `DEBUG_*` actions, `window.__rr`, report with a note. Check the M2 definition of done on a phone, then create the next pack (`m3s1`), delete `m2s1` / `m2s2` (M2 done) and update HANDOFF (Rule 0).

## Verify

`npm install && npm run ready && npm run coverage && npm run fuzz`

## Archive

<!-- older sessions go here; keep out of packs -->

- M0 (scaffold): Vite + React + TS strict scaffold, scripts, repomix config and presets, Rule 0 / 0.5 (D7-D11), Vercel deploy, Node >= 22.12 fix.
- M1 s1 (foundations): `types`, `schema` (Zod, D12), `rng`, `rules-check` guard for tracked `node_modules/` / `dist/`, `PACKING` list (D13), 56 tests.
- M1 s2 (rules pieces): `log`, `bounds`, `conditions`, `effects`, `honor`, `checks`, `echoes`, `story/honor.ts`, `story/traits.ts`; D14, D15; 117 tests, 100% engine lines.
- M1 s3 (reducer, saves, test story, lint, fuzz): reducer (+ choose, flow, init), select, endings, save (+ stateSchema), story index / backgrounds / characters / flags / endings / system, 5-scene test chapter, real `lint-story` and `fuzz`, coverage; D16-D19; 197 tests, 100% engine lines.
