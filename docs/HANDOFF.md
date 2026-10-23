# HANDOFF (living log; update at the end of every session)

## Status

- **Phase:** M2 (UI shell) session 1 of 2 DONE, plus an unplanned **story pass: the intro (Prologue part 1) is live**. Next: M2 session 2 (Settings, keyboard + typewriter, DebugPanel).
- **Deployed:** https://rotandreason.vercel.app/ (auto-deploys on push to `main`). The live page is still the old test story until this is pushed; after the push a new game starts with the intro (`p.dream`), then continues into the test chapter. Not checked on a phone yet.
- **Last verified:** in a repo rebuilt from the pack on Node 22.22: `npm run check` green (typecheck, lint:story 2 chapters 28 scenes 0 errors 0 warnings, 282 tests, rules 103 files); `docs:check` run in a throwaway git repo after the docs were edited; `npm run coverage` 100% lines on `src/engine`; `npm run fuzz` 1,000 runs 0 failures; `npm run build` ok (the Prologue is its own lazy chunk). Not checked: a real browser or phone, and the intro read aloud for tone (do it on the Vercel preview).

## This session (story pass: the intro)

- **Why:** the playable build was a 5-scene feature test and "felt like nothing". Owner's idea: in their universe nobody knows the word "zombie", so the protagonist and the reader are both confused; the game is 85% storytelling, 15% game.
- **Story:** `src/story/chapters/prologue.ts` (23 scenes, ~1,100-1,300 words read, 3 choice scenes = 85.7% narration on the real routes). Day 1 from a fever dream to night: a wrong silence, a woman who turns her head toward a horn, Biscuit hanging in the stairwell (Heart or Grit check, or leave him), Dole at the door (let in / keep out / send on; letting him in plants an echo: knocking from inside the bathroom two scenes later, Reason -10), a church bell and a street of people walking toward it, the Haven loop and Juno's interruption (nobody has a word for them; Haven had a name first), then sleep into `t.wake`. Start scene is now `p.dream`.
- **Rules as code:** `scripts/lintTone.ts` (called from `lintCore`): error on "zombie" / "undead" in story text (D23); warning when a chapter of 8+ scenes has more than 15% choice scenes (D22).
- **Small edits elsewhere:** `strings.ts` Background heading "Who were you before today?" (it said "before the Rot"); 9 flags in `flags.ts`; NPC `dole` in `characters.ts`; conditional lines for the intro's flags in `t.wake`, `t.echo`, `t.gate` (test chapter, text only); `chapters/index.ts` registers `prologue`.
- **Tests (+15, 282 total):** `tests/prologue.test.ts` (every bg x stairs x Dole x radio route is >= 85% narration; Dole echo order and honor; Biscuit checks over 40 seeds; radio flags; "the Rot" not named before the broadcast; Background heading), `tests/lintTone.test.ts`, `tests/engine/testStory.ts` (the real story started at `t.wake`, used by `story`, `gameModel` and `render` tests). The old "test chapter lints" test now lints the whole story.
- **Docs updated:** START_HERE (rule 11, repo map), GAME_DESIGN (pillar 5, micro loop), STORY_FORMAT (§7 rules, §8 checks), STORYBOARD (canon, Prologue rewritten), CHARACTERS (Dole, Biscuit, Juno), ARCHITECTURE, REPOMIX, ROADMAP (D22-D24, M4 line, open question 8), HANDOFF.

## Decisions made

- D22 story first 85:15 (lint warning + route test); D23 nobody has a word for it, "the Rot" is first heard on the Haven broadcast; D24 the intro hands over to the test chapter until M4. Earlier: D1-D21.

## Assumptions to confirm (small, easy to change)

- **New (story):** Haven's recording uses the name "the Rot" from Day 1, so Haven knew before the city did (a seed for `c5.truth`; not yet in STORYBOARD Ch5). Biscuit is Dole's dog; the first bitten man wore a St. Brigid's wristband (a hint that it began at the hospital). The Prologue's `p.street` / `p.gate` are deferred to M4 (the test chapter stands in). The old "mercy-kill" option for Dole is gone: the player cannot know yet. The share is measured per authored scene (a lint proxy); the route test measures what the player actually plays.
- Still open from M1 (STORY_FORMAT §2, §5): `GameState.name`; `LogEntry` shape; `all`/`any`/`not`; `CHOOSE` carries the choice id; new deed tag `lie_harm`; owed remainder pairing (D15); echo `after: N`; `scene.time` applies when the player leaves; `glitch` replaces `text` when Reason < 30; start stats hp 5 / reason 80 / rot 0; a due echo may fire before an ending; endings E5/E6 order; `reduce` START ignores its `state`; starting kit items are not modelled.
- From M2 s1: ending titles are UI labels in `ui/strings.ts`; NPC display names are the capitalised id (`ui/names.ts`); autosave covers every state except `sys.error`; new game over a save needs a second tap; toasts omit the deed tag; Continue shows the raw chapter id (now `p` or `t`) until chapter titles exist (M4); default name "Ash".

## Known bugs

- none

## Known gaps

- **Content budget at 85:15 is undecided** (ROADMAP open question 8): STORYBOARD chapters list ~30% choice scenes. The lint will warn on any 22-scene chapter written that way. Decide before M4.
- **The HUD is always visible** (HP, Reason, honor meter) even in the dream. For a story-first opening, consider fading the HUD in after the first choice (needs a scene flag and a UI tweak; candidate for M2 s2). The typewriter text (M2 s2) will help the intro land.
- The test chapter after the intro is mechanical, not story (it is the placeholder; deleted in M4).
- M2 s2: Settings, keyboard (`1-4`, `Space`, `J`), typewriter, low-HP / low-Reason visuals, DebugPanel, `DEBUG_*` actions, `window.__rr`, `?debug=1`. The Play screen has a single Menu button.
- M3+: Journal, Party cards, TierBanner, check fail-cost hint line, confirm step for irreversible choices. `CAMP` is a stub (M4). Restart chapter appears only once a gate scene was reached or a save with a checkpoint was loaded.

## Environment

- Node >= 22.12 (`nvm install 22 && nvm use 22`, then `npm install`). Vercel builds on Node 22. Push over SSH (`git@github.com:Dnggr/rot-reason.git`).

## Next 3 tasks (M2 session 2: UI shell part 2)

Next pack: `npm run pack:m2s2` (now also carries `tests/engine/testStory.ts`; the `story` pack now carries `prologue.ts` as the voice reference)

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
- M2 s1 (UI shell part 1): App / Game / screens / hooks / gameModel / storage, report builder, D20-D21; 267 tests.
- Story pass (the intro): `chapters/prologue.ts` (23 scenes), `lintTone`, D22-D24; 282 tests.
