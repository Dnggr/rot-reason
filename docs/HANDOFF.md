# HANDOFF (living log; update at the end of every session)

## Status

- **Phase:** M3 code DONE (s1, s2, s3 = the bug-closing session). Next: M4 session 1 (Prologue part 2 + Ch1; settle ROADMAP open question 8 first). M2 and M3 close when the owner has checked them on a phone.
- **Deployed:** https://rotandreason.vercel.app/ (auto-deploys on push to `main`). It shows the older layout until the D27 / D28 work and this session are pushed. **Not checked on a phone yet.**
- **Last verified:** in a repo rebuilt from the pack on Node 22 (with a throwaway `git init` + baseline commit so `docs:check` could run): `npm run typecheck` ok, `npm run test` 454 tests green (426 + 28 new), `npm run rules` ok (158 files), `npm run lint:story` ok (0 errors, 0 warnings), `npm run fuzz` 1000 runs clean, `npm run ready` ok end to end (docs:check included), `npm run coverage` 100% lines on `src/engine`, `npm run build` ok (about 115 KB gzip initial JS), `npm run pack:m4s1` packs. **Still not checked:** the live site, a browser, a phone, a screen reader (the aria-live change is checked by markup only). The UI is tested by server-render checks only. Note: the pack strips blank lines, so the returned files have none; expect blank-line churn in the diff.


## This session (M3 s3: close the M3 bug list, flag more)

- **The six open M3 s2 bugs are fixed** (ROADMAP M3 list, D31): (1) `party +id` is refused with an ERROR when the companion would walk out at once (`relations.wouldLeave`); `scripts/lintParty.ts` warns, in either order. (2) `shift` ignores the dead, and the chapter fear fade skips them (the fade was a second path, found by a probe). (3) `SceneView`'s `aria-live` region holds only the turn being typed. (4) `ConfirmButton` (`ui/confirm.ts`) guards New game on the Title, the Ending and the error fallback (`ui/fallback.ts`). (5) `capScene(before, state, prior)` + `deeds.trimDeeds` give the cap's correction back to the scene's newest same-direction deeds. (6) `GameState.met` (**save v4**, `migrations.v3to4`), `engine/met.ts`, People lists it.
- **Five new bugs flagged, none fixed** (ROADMAP "flagged in the M3 s3 review"): lint skips `party` / `fear` ids in ending rules; `validState` accepts an impossible party; a v1 secret's honor leaves no Journal deed; the typewriter runs behind the Journal and banner; dying offers no retry from the checkpoint (maybe intended).
- **Tests (+28, 454):** `tests/engine/closeout.test.ts` (refused join, the dead, the cap in the deed list, `met`), `tests/ui/closeoutUi.test.ts` (two-tap rule, Ending / fallback / Title guards, one announcement per line), v3 -> v4 migration in `tests/engine/save.test.ts`, party lint in `tests/lint.test.ts`. Fixtures and the v1 / v2 migration tests moved to v4.
- **Docs updated:** HANDOFF, ROADMAP (M3 list, new bug list, D31), HONOR (§3, §6, §7, §8), STORY_FORMAT (party, trust / fear, met), UI_UX (§2, §7), ARCHITECTURE (folders, saves). `scripts/pack.ts`: `m4s1` preset gained the files the new bug list touches.

## Decisions made

- D31 Close the M3 bug list (above, ROADMAP). Earlier: D1-D30.

## Assumptions to confirm (small, easy to change)

- **Banner:** 3 s (was 2 s in UI_UX); tap, Continue or the timer dismisses it. One line per tier is mine (`story/tiers.ts`): edit freely. A reload while it shows loses it.
- **People list (D31):** shows the party, the dead, anyone you have met (named in a scene's `who`, a `say` speaker, or touched by a `trust` / `fear` / `party` effect) and anyone whose numbers moved. **So Dole and Juno (a radio voice) now get cards with trust 0 / fear 0 bars once their scene shows.** If you want companions only, filter in `journalOf` (say so).
- **Refused join:** a recruit at or below the walk-out line is an ERROR log line with no scene or toast; the author sees it through `lint:story`. Join-then-lose-trust in one list is still allowed (the walk-out is logged and toasted).
- **Perk text** on the cards is mine ("Grit checks +2 while he is with you."). Only Brick and Juno have perks the engine applies; Nora, Hart, Calloway and Biscuit show none until their mechanic exists.
- **Journal honor** is the deed's change after the ±25 scene cap: the newest deeds of the scene give back the excess, so one can read "No change".
- **M3 s1 numbers (change in `story/approval.ts`):** one `+` = 5 trust, walk-out at trust -30 unless fear is 60+. Balance is a guess until the fuzz / playtest pass.
- **Who reacts:** the party at the moment of a witnessed deed; for a secret, the party at the `reveal`, in full. Put `['party','+id']` after a deed the newcomer did not see.
- **Not in the approval table (no reaction yet):** `keep_word`, `lie_harm`, `betray`, `torture`, `murder`, `cruelty_show`, and Biscuit.
- **Old saves:** v1 and v2 saves load (migrations); their past deeds are not in the Journal, and a v1 secret pays honor on reveal with no trust hit.
- **Walk-out is silent in the story:** a log line and the toast "X leaves you"; no scene or flag.
- Layout and reading (unchanged from D27 / D28): choices show on the last turn only, also alone in the dock when nobody talks; the page of earlier scenes is not saved; narration is paged by speaker; a tap while text types only finishes the typing; typewriter 30 ms per character (`MS_PER_CHAR`); Soften violence and Sound do nothing yet; `?debug=1` works on the live site.
- Story seeds (unchanged): Haven's recording uses the name "the Rot" from Day 1; Biscuit is Dole's dog; the first bitten man wore a St. Brigid's wristband; `p.street` / `p.gate` are deferred to M4.
- Still open from M1 (STORY_FORMAT §2, §5): `GameState.name`; `LogEntry` shape; `all`/`any`/`not`; `CHOOSE` carries the choice id; new deed tag `lie_harm`; owed remainder pairing (D15); echo `after: N`; `scene.time` applies when the player leaves; `glitch` replaces `text` when Reason < 30; start stats hp 5 / reason 80 / rot 0; a due echo may fire before an ending; endings E5/E6 order; `reduce` START ignores its `state`; starting kit items are not modelled.
- From M2 s1: ending titles are UI labels in `ui/strings.ts`; NPC display names are the capitalised id (`ui/names.ts`); autosave covers every state except `sys.error`; new game over a save needs a second tap (Title, Ending, error fallback; the last two always ask, even if the save failed to write); toasts omit the deed tag; Continue shows the raw chapter id until chapter titles exist (M4); default name "Ash".

## Known bugs

- **Open** (details in ROADMAP M3 list, "flagged in the M3 s3 review"; none blocks M4): (1) `lint:story` skips `party` / `fear` ids in ending rules; (2) `validState` accepts an impossible party (unknown, dead, over 3); (3) a v1 secret that pays honor on reveal leaves no deed in the Journal; (4) the typewriter keeps typing behind the Journal and the tier banner; (5) dying offers only New game / Title.
- Fixed in M3 s3: the six M3 s2 bugs (silent join and leave, dead npc changing and fading, double announcement, New game confirmation, Journal honor vs the cap, People missing the met). Fixed in M3 s2: scroll key at 30 scenes, nested `<header>`, stale companion perks.

## Known gaps

- **Default palette contrast:** `--blood` text is about 2.6:1 on `--bg` (lock chip, error title), under 4.5:1. High contrast fixes it. Fix the default in the M7 accessibility pass, or sooner if it reads badly.
- Focus is not moved on a scene change (falls back to the page; keys cover it).
- **Content budget at 85:15 is undecided** (ROADMAP open question 8). Decide before M4.
- The HUD is always visible, even in the dream (idea: fade it in after the first choice).
- No backdrop or portrait art exists yet (gradient and silhouette placeholders); the text box and panel are semi-opaque and the story text has a text shadow so art will stay readable, but contrast over real art is unchecked. The Background, Settings and Ending screens keep the old centered column.
- The page keeps 30 scenes (`MAX_READ` in `gameModel.ts`); older ones are dropped from the top. Focus stays on the page (not on Continue) when a turn changes, as for scenes.
- The test chapter after the intro is mechanical (deleted in M4).
- Not built: text jitter / whisper lines at low Reason, haptics, sound, soften-violence variants (M7); fail-cost hint line, Journal Notes tab, confirm step for irreversible choices (M3+); `CAMP` is a stub (M4).

## Environment

- Node >= 22.12 (`nvm install 22 && nvm use 22`, then `npm install`). Vercel builds on Node 22. Push over SSH (`git@github.com:Dnggr/rot-reason.git`).

## Next 3 tasks (M4 session 1: Prologue part 2 + Ch1)

Next pack: `npm run pack:m4s1`

0. **Owner first:** unzip over the repo (it has no `package-lock.json`; keep yours), push, open the Vercel preview on a phone and a wide screen, play the intro, open the Journal (button and `J`), trigger a tier change (`?debug=1`, set honor to 25) and check the banner; tick the M2 line in ROADMAP. **Decide ROADMAP open question 8** (content budget at 85:15) before M4 writing starts.
1. Write Prologue part 2 (`p.street`, `p.gate`) and the start of Ch1 per STORYBOARD, with callbacks, echoes and honor lines, at 85:15 (`lint:story` enforces it). Do not author `trait` effects for companion perks (they follow the party).
2. Fix the flagged bugs that the new scenes touch (ending rules with `party` / `fear` conditions: lint gap 1; the pack carries `lintRefs.ts`, `stateSchema.ts`, `honor.ts`). Ask the owner about the death retry (bug 5).
3. Update HANDOFF, tick the M4 lines in ROADMAP, create the next pack (`m4s2`), delete `m4s1` once M4 is done.

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
- UI story in the middle (D28): `say` beats, `turns`, `useTurn`, `Dock`, `Lines`, `SceneView` as the middle, dialog split in the intro; 369 tests.
- M2 s2 (UI shell part 2): Settings (+ `settings.ts`, `useSettings`), keyboard (`keys.ts`, `useKeys`), typewriter (`typewriter.ts`, `useTypewriter`), low-HP / low-Reason visuals (`motion.css`), `engine/debug.ts` (`DEBUG_JUMP` / `SET` / `ROLL`), rewind, DebugPanel in `src/debug/`, D25-D26; 350 tests.
- M3 s1 (social systems part 1): `story/approval.ts`, `engine/relations.ts`, `engine/migrations.ts`, `GameState.owedTags`, walk-out, D29; 395 tests.
- M3 s2 (social systems part 2): `GameState.deeds` (save v3), `engine/deeds.ts`, `journal.ts`, perks from the party, `JournalScreen`, `CharacterCard`, `TierBanner`, three M3 s1 bugs fixed, six new bugs flagged, D30; 426 tests.
- M3 s3 (close the M3 bug list): `GameState.met` (save v4), `engine/met.ts`, refused join + `lintParty`, dead npcs frozen, `trimDeeds`, `ConfirmButton`, aria-live split, five new bugs flagged, D31; 454 tests.
