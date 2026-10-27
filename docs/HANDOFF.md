# HANDOFF (living log; update at the end of every session)

## Status

- **Phase:** M3 code DONE (s1 to s7; s3 to s7 closed their bug lists). Next: M4 session 1 (Prologue part 2 + Ch1; settle ROADMAP open question 8 first). M2 and M3 close when the owner has checked them on a phone.
- **Deployed:** https://rotandreason.vercel.app/ (auto-deploys on push to `main`). It shows the older layout until the D27 / D28 work and the sessions since are pushed. **Not checked on a phone yet.**
- **Last verified:** in a repo rebuilt from the pack on Node 22 (with a throwaway `git init` + baseline commit so `docs:check` could run): `npm run ready` (typecheck, lint:story 0 / 0, 508 tests green = 490 + 18 new, rules, docs:check), `npm run fuzz` 1000 runs clean on seeds 1 and 99, `npm run coverage` 100% of `src/engine` lines. **Still not checked:** the live site, a browser, a phone, a screen reader. The UI is tested by server-render checks and pure rules only, so the ConfirmButton's blur and 4 s timer, the two-tap button, the typewriter pause and the Restart chapter click are checked by their pure rules and markup, not by a click.

## This session (M3 s7: close the eight bugs flagged in M3 s6, flag more)

- **All eight open bugs are fixed** (ROADMAP, D35): (1) `lintGraph` errors on an echo whose target is not tagged `echo`. (2) `time` never goes back in the phase either: `effects.apply` ignores a same-day earlier phase with an ERROR (`bounds.PHASES`); `lintTime` tracks (day, phase). (3) `timeChange.day` is `.max(21)`. (4) New `scripts/lintLists.ts`: warns for an unwitnessed deed with no `secret` after it, the same echo twice in one list, and an echo `at` its own chapter; `lintWalk.effectListsOf` now ends a choice's list with its `echo`. (5) `lintRefs` warns for a `secret` condition nobody holds (scenes and ending rules). (6) The echo `at` own chapter fix is **lint only** (see Assumptions). (7) `echoes.schedule` skips an identical pending echo. (8) Names are 1 to 24 characters and not blank (`bounds.NAME_MAX`; state, save envelope and `startGame`; the Title placeholder state now uses the default name instead of an empty one).
- **Six new bugs flagged, none fixed** (ROADMAP "flagged in the M3 s7 review", each with a probe): `after` counts one scene less for an `on` echo than for a choice `echo`; an echo scene that a plain exit leads to lints clean and runs into `sys.missing`; an echo `after` above 1000 makes a state its own schema refuses; a scene whose choices all cost something can soft-lock and the lint is silent; a scene whose beats are all conditional can show an empty page; speakers of hidden text are marked met when the `glitch` text shows. One stale doc line was fixed too (ARCHITECTURE said `SAVE_VERSION` 3, it is 4).
- **Tests (+18, 508):** `tests/lintLists.test.ts` (new), and added cases in `tests/lintTime.test.ts`, `tests/engine/effects.test.ts`, `tests/engine/echoes.test.ts`, `tests/engine/schema.test.ts`, `tests/engine/stateChecks.test.ts`.
- **Docs updated:** HANDOFF, ROADMAP (M3 lists ticked, new bug list, D35), ARCHITECTURE (`bounds`, `echoes`, `effects`, `init`, `stateSchema`, `lintLists`, lint list), STORY_FORMAT (§5 `time`, `echo`, unwitnessed deeds; §8 lint list), START_HERE (repo map). STORYLINE, UI_UX, HONOR, REPOMIX are untouched (no scene, UI layout or pack-system change). `scripts/pack.ts`: `m4s1` now carries the files the new open bugs touch.

## Decisions made

- D35 Close the M3 s6 bug list (above, ROADMAP). Earlier: D1-D34 (D34: saves are healed on load, not stamped; `time` never runs backwards in the day).

## Assumptions to confirm (small, easy to change)

- **Saves are healed, then checked (D34, my call; I chose healing over a version stamp):** on load, an npc the story added is filled in with its starting numbers, and an npc, flag, met entry, party member, echo, deed record, deed count or trait the story no longer has is dropped (log lines `healed on load...`, and `loadSave` returns `healed`). A removed or renamed scene, background or chapter cannot be healed: replay, then the checkpoint, then a message that says why and that it may be an older build. A hand-edited save with such ids is healed too, not refused (the strict `validState` / `stateProblem` still refuse it, and the fuzz bot uses those). Say if you would rather have a version stamp and a plain "older build" refusal.
- **Time (D34, D35, my call):** a `time` day before the current one, or an earlier phase on the same day, is an ERROR that ignores the whole effect; the same moment and later are fine; a later day may start at any phase; a day change with no phase keeps the phase; a day above 21 is now a schema error (the engine still clamps a hand-built one to 21).
- **Echoes (D35, my call):** an echo `at` its own chapter is only a lint warning (the engine fires it at the next transition; an "only on a chapter change" rule would strand a second echo for that chapter). An identical pending echo (same scene, same `after` or same `at`) is skipped with an `ECHO` line, not an ERROR; the same scene with a different `after` still stacks. Say if you would rather have the engine rule or an ERROR.
- **Names (D35, my call):** a name is 1 to 24 characters and not blank; a hand-edited save with another name is refused (the load fails with a reason), not healed, because only a hand edit can make one. `startGame` throws on a bad name (the reducer shows the error scene).
- **`history` in a save is checked for shape only** (`scene:choice`), not for scene ids, so a renamed scene does not strand an otherwise fine save.
- **Story-only traits need a row** in `story/traits.ts` `TRAIT_BONUS` (an empty `{}` is fine), or `lint:story` errors and a save with that trait is refused. `Hardened` has one now.
- **ConfirmButton wait (D33):** 4 s, and a blur also disarms. Change `ARM_MS` in `ui/confirm.ts`.
- **Death retry (D32, my call):** dying offers Restart chapter (back to the last checkpoint) beside New game and Title. Only the death ending; the real endings stay final. Say if you want it removed or on every ending.
- **Old-save honor:** a revealed v1 secret shows in the Journal as a deed called "Unknown".
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
- Still open from M1 (STORY_FORMAT §2, §5): `GameState.name` (now 1 to 24 characters, D35); `LogEntry` shape; `all`/`any`/`not`; `CHOOSE` carries the choice id; new deed tag `lie_harm`; owed remainder pairing (D15); echo `after: N`; `scene.time` applies when the player leaves; `glitch` replaces `text` when Reason < 30; start stats hp 5 / reason 80 / rot 0; a due echo may fire before an ending; endings E5/E6 order; `reduce` START ignores its `state`; starting kit items are not modelled.
- From M2 s1: ending titles are UI labels in `ui/strings.ts`; NPC display names are the capitalised id (`ui/names.ts`); autosave covers every state except `sys.error`; new game over a save needs a second tap (Title, Ending, error fallback; the last two always ask, even if the save failed to write); toasts omit the deed tag; Continue shows the raw chapter id until chapter titles exist (M4); default name "Ash".

## Known bugs

- **Open** (details in ROADMAP M3 list, "flagged in the M3 s7 review"; none blocks M4, but 1 and 2 matter as soon as M4 plants echoes): (1) `after` counts one scene less for an `on` echo than for a choice `echo` (`c1.a > c1.e > c1.b` vs `c1.a > c1.b > c1.e`); (2) an echo scene that a plain exit leads to lints clean and ends on `sys.missing`; (3) an echo `after` above 1000 passes schema and lint but makes a state the schema refuses; (4) a scene whose choices all have a `cost` can soft-lock and the lint is silent; (5) a scene whose beats are all conditional can show an empty page; (6) `met` counts speakers of hidden text when the `glitch` text shows.
- Fixed in M3 s7: an echo target not tagged `echo`, `time` moving the phase backwards, a `time` day above 21 clamped silently, an unwitnessed deed with no `secret` forfeited without a lint warning, a `secret` condition nobody holds, an echo `at` its own chapter (lint), the same echo scheduled twice, any save `name`; ARCHITECTURE's `SAVE_VERSION`. Fixed in M3 s6: `trait` ids not linted, an echo `at` a chapter no scene has, `time` moving the day backwards, saves naming deeds / `who` / `deedCount` keys / traits / `atChapter` / a party member not in `met` / any `history` text the story lacks, and a save refused when the story changes its ids (now healed). Fixed in M3 s5: saves not checked for references (echo / resume scenes, bg, flags, chapter, met, owed keys, npc table), `party -ghost` silent success, a ConfirmButton that stays armed. Fixed in M3 s4: ending rules with `party` / `fear` ids not linted, impossible party accepted, v1 secret honor missing from the Journal, typewriter running behind overlays, no retry after death. Fixed in M3 s3: the six M3 s2 bugs (silent join and leave, dead npc changing and fading, double announcement, New game confirmation, Journal honor vs the cap, People missing the met). Fixed in M3 s2: scroll key at 30 scenes, nested `<header>`, stale companion perks.

## Known gaps

- **Default palette contrast:** `--blood` text is about 2.6:1 on `--bg` (lock chip, error title), under 4.5:1. High contrast fixes it. Fix the default in the M7 accessibility pass, or sooner if it reads badly.
- Focus is not moved on a scene change (falls back to the page; keys cover it).
- **Content budget at 85:15 is undecided** (ROADMAP open question 8). Decide before M4.
- The HUD is always visible, even in the dream (idea: fade it in after the first choice).
- No backdrop or portrait art exists yet (gradient and silhouette placeholders); the text box and panel are semi-opaque and the story text has a text shadow so art will stay readable, but contrast over real art is unchecked. The Background, Settings and Ending screens keep the old centered column.
- The page keeps 30 scenes (`MAX_READ` in `gameModel.ts`); older ones are dropped from the top. Focus stays on the page (not on Continue) when a turn changes, as for scenes.
- **A healed save is silent to the player:** `loadSave` returns `healed` and the log has the lines (they show in the debug report), but the UI shows no notice. Add a toast or a line on Continue if you want one.
- The test chapter after the intro is mechanical (deleted in M4).
- Not built: text jitter / whisper lines at low Reason, haptics, sound, soften-violence variants (M7); fail-cost hint line, Journal Notes tab, confirm step for irreversible choices (M3+); `CAMP` is a stub (M4).

## Environment

- Node >= 22.12 (`nvm install 22 && nvm use 22`, then `npm install`). Vercel builds on Node 22. Push over SSH (`git@github.com:Dnggr/rot-reason.git`).

## Next 3 tasks (M4 session 1: Prologue part 2 + Ch1)

Next pack: `npm run pack:m4s1`

0. **Owner first:** unzip over the repo (it has no `package-lock.json`; keep yours), push, open the Vercel preview on a phone and a wide screen, play the intro, open the Journal (button and `J`), trigger a tier change (`?debug=1`, set honor to 25) and check the banner; on Title tap New game once and wait 4 s (it must go back to its label); tick the M2 line in ROADMAP. Open `docs/STORYLINE.md`, read it against the game, and add your own lines (each ending `-joshua`). **Decide ROADMAP open question 8** (content budget at 85:15) before M4 writing starts.
1. Write Prologue part 2 (`p.street`, `p.gate`) and the start of Ch1 per STORYBOARD, with callbacks, echoes and honor lines, at 85:15 (`lint:story` enforces it). Do not author `trait` effects for companion perks (they follow the party).
2. Fix the flagged bugs that the new scenes touch **before** planting echoes: bug 1 (`after` counts differently for `on` and choice echoes: decide the rule, then check every `after` you write), bug 2 (echo scene reached by a plain exit), bug 3 (`after` max), and bugs 4 and 5 if a scene of yours can hit them (the pack carries `lintGraph.ts`, `lintRefs.ts`, `lintLists.ts`, `lintWalk.ts`, `echoes.ts`, `effects.ts`, `flow.ts`, `schema.ts`, `met.ts`, `select.ts`). Every new story trait needs a `TRAIT_BONUS` row. Keep `STORYLINE.md` true and follow the `-joshua` lines. Confirm the death retry with the owner.
3. Update HANDOFF and STORYLINE, tick the M4 lines in ROADMAP, create the next pack (`m4s2`), delete `m4s1` once M4 is done.

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
- M3 s4 (close the bugs flagged in M3 s3): ending-rule lint for `party` / `fear`, party refinement in `gameStateSchema`, `unknown` deed for a v1 secret, typewriter pauses under overlays, Restart chapter on the death ending, three new bugs flagged, D32; 462 tests.
- M3 s5 (close the bugs flagged in M3 s4): `Story.flags`, `engine/stateRefs`, `stateProblem`, `party -id` of an unknown npc, ConfirmButton disarm (`ui/confirm.step`), `docs/STORYLINE.md`, five new bugs flagged, D33; 472 tests.
- M3 s6 (close the bugs flagged in M3 s5): `lintRefs` trait ids and echo-`at` chapters, `lintTime`, `time` refuses a past day, `refProblem` on deeds / traits / `atChapter` / party vs `met` / history shape, `engine/stateHeal` + `loadableState` + `loadProblem` (saves healed on load), `Hardened` row, eight new bugs flagged, D34; 490 tests.
- M3 s7 (close the bugs flagged in M3 s6): `lintGraph` echo-target tag, `time` phase guard (`bounds.PHASES`) + `lintTime` phase, `timeChange.day` max 21, `scripts/lintLists.ts`, `lintRefs` secret conditions, `echoes.schedule` dedupe, `NAME_MAX` and the name bound, six new bugs flagged, D35; 508 tests.
