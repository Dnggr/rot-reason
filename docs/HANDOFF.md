# HANDOFF (living log; update at the end of every session)

## Status

- **Phase:** M2 (UI shell) code DONE, plus a UI side session (stage layout, below). M2 closes when the owner has checked the definition of done on a phone. Next: M3 (social systems), session 1.
- **Deployed:** https://rotandreason.vercel.app/ (auto-deploys on push to `main`). It shows the old centered layout until this is pushed. **Not checked on a phone yet.**
- **Last verified:** in a repo rebuilt from the pack on Node 22.22: `npm install`, `npm run typecheck` ok, `npm run test` 355 tests green (350 + 5 new), `npm run rules` ok (132 files), `npx vite build` ok (initial JS about 111 KB gzip, as before). Screenshots taken with headless Chromium of Title and a choices scene at 1920x1000 and 390x844: layout as in the sketches. `npm run ready` green (check + docs:check, in a temporary git repo; lint:story 0 errors). Not re-run: `fuzz` and `coverage` (no engine or story file changed). **Not checked:** a real phone, the typewriter pace, screen readers.

## This session (UI: stage layout from the owner's sketches, D27)

- **Title:** `TitleScreen` is now `<main class="stage title">`: a `Backdrop name="title"` plus a left column (`.title-menu`: title, tagline, Continue, New game, Settings) at the bottom-left. Same on every screen size.
- **Play (wide, 900 px and up):** CSS grid on `.play`: HUD (`StatBar` + `HonorMeter`, in `<header class="hud">`) top-left, Menu / Settings top-right, toasts under the HUD, portrait bottom-left, text box bottom-center, Choices panel (`<aside class="panel">`, heading "Choices") on the right. Below 900 px it stacks in one column (HUD, portrait, text box, toasts, Choices, Menu / Settings).
- **Components:** new `ui/components/Backdrop.tsx` (full-screen layer; `--bg-img: url(/bg/<name>.webp)` over a gradient; name stripped to `[a-zA-Z0-9_-]`; a missing file shows the gradient). `SceneView` now renders backdrop + portrait (one silhouette per `who` id) + text box (place caption, narration, `children`) inside `<section class="scene">` with `display: contents`; props unchanged except the optional `children`. `PlayScreen` puts Continue (for `next` scenes) inside the text box and the choices in the Choices panel; keys, typewriter, vignette, `lowreason` are unchanged. `strings.ts` gets `choicesTitle`.
- **Styles:** new `styles/stage.css` (imported in `main.tsx`); `play.css` lost the old `.art`, `.place`, `.who`, `.sil` rules (moved and reworked in `stage.css`).
- **Art hook:** drop WebP files in `public/bg/` (`title.webp`, `<place>.webp`; see `public/bg/README.txt`). None exist yet, so every backdrop is the dark gradient and the portrait is a silhouette with the name.
- **Tests (+5, 355 total):** `tests/ui/stage.test.ts` (Backdrop URL and name sanitizing, Title column, Play pieces, Continue inside the text box). No existing test changed.
- **Docs updated:** UI_UX (§1, §2, §3 rewritten as the stage layout, §4, §10), ARCHITECTURE (§2 folders, §9 UI rules: 5 CSS files, Backdrop), START_HERE (repo map, stack line), ROADMAP (M2 checkbox, D27), README (status), HANDOFF, `public/bg/README.txt`. `scripts/pack.ts` and `package.json` unchanged: the next session is still M3 s1 and its pack already exists.

## Decisions made

- D27 stage layout (backdrop, HUD, portrait, text box, Choices panel; Title left column). Earlier: D1-D26.

## Assumptions to confirm (small, easy to change)

- **Stage layout (reading of the sketches):** the big "Background" is a full-screen image behind everything; the three wide lines near the top are read as that scene area, the long lines at the bottom as the text box (with the portrait to its left), and the "Choices" box as a right-hand panel. If the narration should sit at the top instead, change `grid-template-areas` in `stage.css` (one line) and move `.textbox`. The Title's third, larger button in the sketch is not modelled (all three buttons are equal).
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
- No backdrop or portrait art exists yet (gradient and silhouette placeholders); the text box and panel are semi-opaque so art will stay readable, but contrast over real art is unchecked. The Background, Settings and Ending screens keep the old centered column.
- The test chapter after the intro is mechanical (deleted in M4).
- Not built: text jitter / whisper lines at low Reason, haptics, sound, soften-violence variants (M7); Journal, Party cards, TierBanner, fail-cost hint line, confirm step for irreversible choices (M3+); `CAMP` is a stub (M4).

## Environment

- Node >= 22.12 (`nvm install 22 && nvm use 22`, then `npm install`). Vercel builds on Node 22. Push over SSH (`git@github.com:Dnggr/rot-reason.git`).

## Next 3 tasks (M3 session 1: social systems part 1)

Next pack: `npm run pack:m3s1`

0. **Owner first:** push this, open the Vercel preview on a phone and a wide screen, and tick the M2 line in ROADMAP (layout, text sizes, typewriter pace, high contrast). Say if the stage layout reads differently from your sketches. Report anything with `?debug=1` and Copy debug report.
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
- UI stage layout (D27): `Backdrop`, `SceneView` as stage parts, `stage.css`, Title left column, Choices panel; 355 tests.
- M2 s2 (UI shell part 2): Settings (+ `settings.ts`, `useSettings`), keyboard (`keys.ts`, `useKeys`), typewriter (`typewriter.ts`, `useTypewriter`), low-HP / low-Reason visuals (`motion.css`), `engine/debug.ts` (`DEBUG_JUMP` / `SET` / `ROLL`), rewind, DebugPanel in `src/debug/`, D25-D26; 350 tests.
