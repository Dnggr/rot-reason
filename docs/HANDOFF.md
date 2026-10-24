# HANDOFF (living log; update at the end of every session)

## Status

- **Phase:** M2 (UI shell) session 2 of 2 DONE in code. M2 closes when the owner has checked the definition of done on a phone (below). Next: M3 (social systems), session 1.
- **Deployed:** https://rotandreason.vercel.app/ (auto-deploys on push to `main`). It still shows the build from before M2 s2 until this is pushed. After the push: Settings on the Title and next to Menu, typewriter text, keys, `?debug=1`. **Not checked on a phone yet.**
- **Last verified:** in a repo rebuilt from the pack on Node 22.22: `npm run check` green (typecheck, lint:story 2 chapters 28 scenes 0 errors 0 warnings, 350 tests, rules 129 files); `docs:check` run in a git repo after the docs were edited; `npm run coverage` 100% lines on `src/engine`; `npm run fuzz` 1,000 runs 0 failures; `npx vite build` ok (initial JS about 111 KB gzip, DebugPanel its own 2 KB chunk). The interactive parts (typewriter over time, Space / digits / field guard, Settings applying to `<html>`, the panel's buttons, forced rolls, rewind refusal, reduced motion) were also run once in jsdom with a throwaway test that is not in the repo (jsdom is not a dependency). **Not checked:** a real browser or phone, the typewriter pace by eye, the high-contrast look, screen readers.

## This session (M2 s2)

- **Settings:** `ui/settings.ts` (type, defaults, `rr_settings_v1`, `applySettings`), `hooks/useSettings.ts`, `screens/SettingsScreen.tsx`. Text size S/M/L/XL (`<html data-text>` drives `--story-size`, `--story-line`, `--ui-size`), Reduce motion, High contrast (palette tokens, text pairs all above 7:1), and Soften violence and Sound, which are stored only (nothing to soften or play yet). Reset saved game (two taps) shows only when Settings was opened from the Title. Title and Play (next to Menu) open Settings; Back returns to where it came from (`UiState.from`). `ui/storage.ts`: `Store.store` is now an `EraseStore` (adds `removeItem`).
- **Keyboard:** `ui/keys.ts` + `hooks/useKeys.ts`. `1-4` pick, `Space` finishes typing then continues a narration scene, `J` reserved for the Journal (inert until M3). Ignored in fields, with ctrl / meta / alt, on key repeat; `Space` on a focused button is left to the button.
- **Typewriter:** `ui/typewriter.ts` (pure), `hooks/useTypewriter.ts` (rAF), owned by `PlayScreen`. Whole text always in the DOM; the tail is transparent (`.tw-rest`). While it types, a tap or `1-4` only finishes it. Off with Reduce motion. The actions area is keyed by `step` (scenes played) so choices ease in each scene and a stale focused button cannot be pressed twice.
- **Low vitals:** hp 2 or less shows a red vignette (`.vignette`, outside `.play` so `filter` on mood-dread cannot break `position: fixed`); Reason under 30 adds `lowreason` (glow + flicker). All animation is in the new `styles/motion.css`.
- **Debug:** `engine/debug.ts` (`DEBUG_JUMP`, `DEBUG_SET`, `DEBUG_ROLL`, 100% covered), `LogEntry.kind` `DEBUG`, `gameModel.rewind` (`DEBUG_REWIND`, UI-level), `uiReducer(story, debug)` drops `DEBUG_*` unless the panel is mounted. Panel in `src/debug/` (StateView, Controls, forceRoll, rrHandle, debug.css), loaded lazily by `main.tsx` in dev or with `?debug=1`, handed to `<App debugPanel>` via `ui/debugApi.ts`. `window.__rr = { state, dispatch, story }` while mounted. Copy debug report has a note box.
- **Fixes on the way:** `useSettings` read `window` while rendering (broke any render without a window); guarded.
- **Tests (+68, 350 total):** `tests/engine/debug.test.ts`, `tests/ui/{settings,typewriter,keys,vitals,debugModel,renderPlay}.test.ts`, `tests/debug/{forceRoll,panel}.test.ts`; `render.test.ts` got the new props.
- **Docs updated:** START_HERE (repo map, `?debug=1`), UI_UX (screens, keys, typewriter, vitals, settings, accessibility), ARCHITECTURE (§1 debug import rule, §2 folders, §4 DEBUG actions, §7 panel, §9 UI rules), ROADMAP (M2 checkboxes, D25, D26), README (status), HANDOFF, `scripts/pack.ts` (m2s1 and m2s2 deleted, m3s1 added), `package.json` scripts.

## Decisions made

- D25 DEBUG actions and where the panel lives; D26 typewriter, key and settings behavior. Earlier: D1-D24.

## Assumptions to confirm (small, easy to change)

- **Typewriter pace:** 30 ms per character (UI_UX §7) is about 12 s for a 400-character scene. If it drags on a phone, change `MS_PER_CHAR` in `ui/typewriter.ts` (one number).
- Tapping a choice or Continue while text is typing only finishes the typing (also for `1-4`). `Space` continues narration scenes after typing (UI_UX only said it skips typing).
- Soften violence and Sound do nothing yet (stored, `soften` class on `<html>`). Settings first run follows the device's reduced-motion preference.
- `?debug=1` works on the live site too (anyone can add it), as the plan said.
- "Set seed" reseeds the roll stream (`state.rng`), not `state.seed`, so replays keep their meaning. Rewind refuses a run edited with jump / set (its history no longer reproduces it).
- **New (story):** Haven's recording uses the name "the Rot" from Day 1, so Haven knew before the city did (a seed for `c5.truth`; not yet in STORYBOARD Ch5). Biscuit is Dole's dog; the first bitten man wore a St. Brigid's wristband (a hint that it began at the hospital). The Prologue's `p.street` / `p.gate` are deferred to M4 (the test chapter stands in). The old "mercy-kill" option for Dole is gone: the player cannot know yet. The share is measured per authored scene (a lint proxy); the route test measures what the player actually plays.
- Still open from M1 (STORY_FORMAT §2, §5): `GameState.name`; `LogEntry` shape; `all`/`any`/`not`; `CHOOSE` carries the choice id; new deed tag `lie_harm`; owed remainder pairing (D15); echo `after: N`; `scene.time` applies when the player leaves; `glitch` replaces `text` when Reason < 30; start stats hp 5 / reason 80 / rot 0; a due echo may fire before an ending; endings E5/E6 order; `reduce` START ignores its `state`; starting kit items are not modelled.
- From M2 s1: ending titles are UI labels in `ui/strings.ts`; NPC display names are the capitalised id (`ui/names.ts`); autosave covers every state except `sys.error`; new game over a save needs a second tap; toasts omit the deed tag; Continue shows the raw chapter id (now `p` or `t`) until chapter titles exist (M4); default name "Ash".

## Known bugs

- none known

## Known gaps

- **Default palette contrast:** `--blood` text is about 2.6:1 on `--bg` (lock chip, error title), under 4.5:1. High contrast fixes it. Fix the default in the M7 accessibility pass, or sooner if it reads badly.
- Focus is not moved on a scene change (falls back to the page; keys cover it).
- **Content budget at 85:15 is undecided** (ROADMAP open question 8). Decide before M4.
- The HUD is always visible, even in the dream (idea: fade it in after the first choice).
- The test chapter after the intro is mechanical (deleted in M4).
- Not built: text jitter / whisper lines at low Reason, haptics, sound, soften-violence variants (M7); Journal, Party cards, TierBanner, fail-cost hint line, confirm step for irreversible choices (M3+); `CAMP` is a stub (M4).

## Environment

- Node >= 22.12 (`nvm install 22 && nvm use 22`, then `npm install`). Vercel builds on Node 22. Push over SSH (`git@github.com:Dnggr/rot-reason.git`).

## Next 3 tasks (M3 session 1: social systems part 1)

Next pack: `npm run pack:m3s1`

0. **Owner first:** open the Vercel preview on a phone and tick the M2 line in ROADMAP (layout, text sizes, typewriter pace, high contrast). Report anything with `?debug=1` and Copy debug report.
1. Companion approval table (story data, passed into the engine like deeds, D14) and the trust / fear effects it drives; party joins and leaves.
2. Secrets and reveal: the trust hit when a secret surfaces (engine side exists: `owed`, `surface`); golden test that an unwitnessed deed surfaces later and applies the remainder (M3 definition of done).
3. Update HANDOFF, create the next pack (`m3s2`: Journal, tier banners, Party cards; echo countdown is already visible in the debug panel), delete `m3s1` when M3 is done.

## Verify

`npm install && npm run ready && npm run coverage && npm run fuzz`

## Archive

<!-- older sessions go here; keep out of packs -->

- M0 (scaffold): Vite + React + TS strict scaffold, scripts, repomix config and presets, Rule 0 / 0.5 (D7-D11), Vercel deploy, Node >= 22.12 fix.
- M1 s1 (foundations): `types`, `schema` (Zod, D12), `rng`, `rules-check` guard for tracked `node_modules/` / `dist/`, `PACKING` list (D13), 56 tests.
- M1 s2 (rules pieces): `log`, `bounds`, `conditions`, `effects`, `honor`, `checks`, `echoes`, `story/honor.ts`, `story/traits.ts`; D14, D15; 117 tests, 100% engine lines.
- M1 s3 (reducer, saves, test story, lint, fuzz): reducer (+ choose, flow, init), select, endings, save (+ stateSchema), story index / backgrounds / characters / flags / endings / system, 5-scene test chapter, real `lint-story` and `fuzz`, coverage; D16-D19; 197 tests, 100% engine lines.
- M2 s1 (UI shell part 1): App / Game / screens / hooks / gameModel / storage, report builder, D20-D21; 267 tests.
- Story pass (the intro): `chapters/prologue.ts` (23 scenes), `lintTone`, D22-D24; 282 tests.
- M2 s2 (UI shell part 2): Settings (+ `settings.ts`, `useSettings`), keyboard (`keys.ts`, `useKeys`), typewriter (`typewriter.ts`, `useTypewriter`), low-HP / low-Reason visuals (`motion.css`), `engine/debug.ts` (`DEBUG_JUMP` / `SET` / `ROLL`), rewind, DebugPanel in `src/debug/`, D25-D26; 350 tests.
