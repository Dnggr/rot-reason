# HANDOFF (living log; update at the end of every session)

## Status

- **Phase:** M3 session 1 (social systems part 1) code DONE. Next: M3 session 2 (Journal, Party cards, tier banners). M2 still closes when the owner has checked the definition of done on a phone.
- **Deployed:** https://rotandreason.vercel.app/ (auto-deploys on push to `main`). It shows the older layout until the D27 / D28 work is pushed. **Not checked on a phone yet.**
- **Last verified:** in a repo rebuilt from the pack on Node 22.22: `npm install`, `npm run typecheck` ok, `npm run test` 395 tests green (369 + 26 new), `npm run rules` ok, `npm run lint:story` ok (0 errors, 0 warnings), `npm run fuzz` 1000 runs clean on seeds 1 and 99, `npm run coverage` 100% lines on `src/engine`. **Not checked:** `npm run ready` end to end (the rebuilt repo has no git, so `docs:check` skipped its "code changed" test and only checked the Next pack line), the live site, a browser, a phone. Note: the pack strips blank lines, so the returned files have none; expect blank-line churn in the diff.

## This session (M3 s1: companion approval, secrets and the trust hit, party rules)

- **Approval table:** `story/approval.ts` (`APPROVAL`, `SOCIAL`), the HONOR §5 table at 5 trust per `+`; it travels as `story.social` and is an optional 4th argument of `apply` / `applyAll` (D14). New `engine/relations.ts`: `shift`, `party` (moved from `effects.ts`; the dead cannot join), `react`, `walkouts`.
- **Reactions:** a witnessed `honor` effect moves the trust of the companions in the party, scaled by the deed's repeat factor (`applyDeed` now returns `deed: { tag, witnessed, factor }`). An unwitnessed deed moves nobody; `applyAll` stores its tag in the new `GameState.owedTags[secret]` next to `owed`. `reveal` pays the honor, forgets the tags and makes the party present react in full.
- **Walk-out:** after every effect list and at a chapter change, a companion with trust <= -30 and fear < 60 leaves the party.
- **Saves:** `SAVE_VERSION` 2, `engine/migrations.ts` `v1to2`, `stateSchema` has `owedTags`.
- **UI:** toasts say "X joins you" / "X leaves you"; "will remember" only for a trust change or a fear increase.
- **Bugs:** three fixed, three open (below; ROADMAP M3 list).
- **Tests (+26, 395):** new `tests/engine/social.test.ts` (approval, reveal, party, walk-out, golden unwitnessed-deed path), approval table in `storyData`, real-story golden (threaten Brick with Nora beside you), v1 -> v2 migration, whole-number schema, toasts. Fixtures got `owedTags` and a small `social` table.
- **Docs updated:** HONOR (§3, §5, §6, §8), STORY_FORMAT (§5), GAME_DESIGN, ARCHITECTURE (folders, state, flow, saves), CHARACTERS (thresholds), UI_UX (toasts), START_HERE (repo map), ROADMAP (M3 checklist, bug list, D29), README, HANDOFF. `scripts/pack.ts` and `package.json` gained `m3s2`.

## Decisions made

- D29 companion approval, `owedTags`, walk-out, save v2 (above, ROADMAP). Earlier: D1-D28.

## Assumptions to confirm (small, easy to change)

- **M3 s1 numbers (change in `story/approval.ts`):** one `+` in the HONOR §5 table = 5 trust (`STEP`), so `++` = 10; walk-out at trust -30 unless fear is 60+. Balance is a guess until the fuzz / playtest pass.
- **Who reacts:** the party at the moment of a witnessed deed; for a secret, the party at the moment of the `reveal`, in full (no repeat scaling). Put `['party','+id']` after a deed the newcomer did not see.
- **Not in the table (no reaction yet):** `keep_word`, `lie_harm`, `betray`, `torture`, `murder`, `cruelty_show`, and Biscuit. HONOR §5 lists only ten tags; say if Brick should like `keep_word`, or everyone should recoil from `murder`.
- **Old saves:** a v1 save loads (migration), but its held secrets pay honor on reveal with no trust hit.
- **Walk-out is silent in the story:** a log line and the toast "X leaves you"; no scene, no flag, and the perk trait stays (open bug below).
- **Reading of the second sketch:** the red lines in the middle are the story text; the bottom frame holds portrait (left), the spoken line (center) and Choices (right). "The character, choices and dialog only show when a character talks" is built as: the portrait and the line show only while a character speaks; the **Choices panel also shows on the last turn of a choice scene when nobody is talking**, alone in the bottom bar, because most choice scenes end on narration and hiding them would soft-lock the game. If choices must appear only after a character speaks, end those scenes on a `say` beat (data only) or tell me and I will gate them.
- **The page is not saved:** after reload and Continue the page starts at the current scene (saves hold state, not text; rebuilding the earlier text from history is possible later if wanted).
- **Narration is also paged:** a scene whose narration is split by a spoken line takes one Continue per turn (`p.dole` has four turns). Scenes with no speech are still one turn and one Continue, as before.
- Choice scenes in the intro that end on narration (`p.stairs`, `p.dole`, `p.radio`) show only the Choices panel at the bottom right. `who` is still stored and linted, but draws nothing now (the Journal can use it).
- **Mixed story lines** like `"I understand," Dole says, in the voice of a man who does not.` were split into a spoken beat plus narration (`He says it in the voice of a man who does not.`); the wording moved a little, the meaning did not. Flag any line you want back as it was.
- Tapping a choice or Continue while text is typing only finishes the typing (also for `1-4`). `Space` goes to the next turn after typing; it does nothing once the choices show.
- Soften violence and Sound do nothing yet (stored, `soften` class on `<html>`). Settings first run follows the device's reduced-motion preference.
- Typewriter pace: 30 ms per character (UI_UX §7). If it drags on a phone, change `MS_PER_CHAR` in `ui/typewriter.ts` (one number).
- `?debug=1` works on the live site too (anyone can add it), as the plan said. "Set seed" reseeds the roll stream (`state.rng`), not `state.seed`. Rewind refuses a run edited with jump / set.
- Story seeds from before (unchanged): Haven's recording uses the name "the Rot" from Day 1; Biscuit is Dole's dog; the first bitten man wore a St. Brigid's wristband; `p.street` / `p.gate` are deferred to M4; the old "mercy-kill" option for Dole is gone.
- Still open from M1 (STORY_FORMAT §2, §5): `GameState.name`; `LogEntry` shape; `all`/`any`/`not`; `CHOOSE` carries the choice id; new deed tag `lie_harm`; owed remainder pairing (D15); echo `after: N`; `scene.time` applies when the player leaves; `glitch` replaces `text` when Reason < 30 (and is one narration turn); start stats hp 5 / reason 80 / rot 0; a due echo may fire before an ending; endings E5/E6 order; `reduce` START ignores its `state`; starting kit items are not modelled.
- From M2 s1: ending titles are UI labels in `ui/strings.ts`; NPC display names are the capitalised id (`ui/names.ts`, also the speaker name on a `say` line); autosave covers every state except `sys.error`; new game over a save needs a second tap; toasts omit the deed tag; Continue shows the raw chapter id until chapter titles exist (M4); default name "Ash".

## Known bugs

- **Open** (details in ROADMAP M3 list): (1) `SceneView` scroll key repeats once the page holds 30 scenes (latent until M4); (2) nested `<header>` in `PlayScreen` / `StatBar`; (3) companion perks (`Bruiser`) are not removed when the companion leaves, is killed or walks out.

## Known gaps

- **Default palette contrast:** `--blood` text is about 2.6:1 on `--bg` (lock chip, error title), under 4.5:1. High contrast fixes it. Fix the default in the M7 accessibility pass, or sooner if it reads badly.
- Focus is not moved on a scene change (falls back to the page; keys cover it).
- **Content budget at 85:15 is undecided** (ROADMAP open question 8). Decide before M4.
- The HUD is always visible, even in the dream (idea: fade it in after the first choice).
- No backdrop or portrait art exists yet (gradient and silhouette placeholders); the text box and panel are semi-opaque and the story text has a text shadow so art will stay readable, but contrast over real art is unchecked. The Background, Settings and Ending screens keep the old centered column.
- The page keeps 30 scenes (`MAX_READ` in `gameModel.ts`); older ones are dropped from the top. Focus stays on the page (not on Continue) when a turn changes, as for scenes.
- The test chapter after the intro is mechanical (deleted in M4).
- Not built: text jitter / whisper lines at low Reason, haptics, sound, soften-violence variants (M7); Journal, Party cards, TierBanner, fail-cost hint line, confirm step for irreversible choices (M3+); `CAMP` is a stub (M4).
- **Journal "Deeds" has no data:** HONOR §7 wants the last 20 deeds with tag, witnessed or not, and who reacted. State keeps only `deedCount` and the 200-line log, so M3 s2 must add a stored deed list (new `GameState` field: `SAVE_VERSION` 3 + a migration).
- Effects on a dead npc (`trust`, `fear`) still change its numbers; harmless today.

## Environment

- Node >= 22.12 (`nvm install 22 && nvm use 22`, then `npm install`). Vercel builds on Node 22. Push over SSH (`git@github.com:Dnggr/rot-reason.git`).

## Next 3 tasks (M3 session 2: Journal, Party cards, tier banners)

Next pack: `npm run pack:m3s2`

0. **Owner first:** push this, open the Vercel preview on a phone and a wide screen, play the intro, and tick the M2 line in ROADMAP. Then, with `?debug=1`, jump to `t.street` after sharing with Nora and watch her trust move when you threaten Brick (State tree > `npc`). Decide the open numbers in Assumptions.
1. Journal (Deeds, People) and Party cards (`CharacterCard`: trust, fear, alive, perk). Deeds needs the stored deed list (Known gaps): add it with a migration. Fix the open bug about perks while there.
2. Tier banners (HONOR §2: a full-screen beat once per tier change).
3. Update HANDOFF, tick M3 in ROADMAP, create the next pack (`m4s1`: Prologue part 2 + Ch1, needs the open question 8 settled first), delete `m3s1` and `m3s2` (M3 done).

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
