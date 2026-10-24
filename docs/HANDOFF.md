# HANDOFF (living log; update at the end of every session)

## Status

- **Phase:** M2 (UI shell) code DONE, plus two UI side sessions (stage layout D27; story in the middle with a speaker dock D28, below). M2 closes when the owner has checked the definition of done on a phone. Next: M3 (social systems), session 1.
- **Deployed:** https://rotandreason.vercel.app/ (auto-deploys on push to `main`). It shows the older layout until this is pushed. **Not checked on a phone yet.**
- **Last verified:** in a repo rebuilt from the pack on Node 22.22: `npm install`, `npm run typecheck` ok, `npm run test` 365 tests green (355 + 10 new), `npm run rules` ok, `npm run lint:story` ok (0 errors, 0 warnings), `npx vite build` ok (initial JS about 111 KB gzip, as before), `npm run fuzz` clean. **Not checked:** the new layout in a real browser (the sandbox has none, so no screenshot was taken; markup and behavior are covered by render tests), a real phone, the typewriter pace, screen readers.

## This session (UI: story in the middle, dock only when a character talks, D28)

- **Owner's sketch:** the story is in the middle of the screen; the portrait, the dialog box and the Choices appear in a bottom bar only when a character talks; what they said stays in the middle text afterwards.
- **Story data:** new beat `{ say: '<character id>', text, if? }` (STORY_FORMAT §2, "Spoken lines"). The intro's dialog was split into `say` + narration beats: `p.dole` (Dole, 3 spoken lines), `p.dole_in`, `p.dole_out`, `p.dole_sent` (+ the Biscuit line), `p.voice` (Juno, 3 lines); the test chapter's `t.echo` Nora whisper. Unnamed speakers (recording, foreman, anchor) stay narration. No scene was added or removed, so pacing and routes are unchanged.
- **Engine (pure):** `Beat` type and Zod schema accept `say`; `currentView` returns `beats` (`{ text, say }`) next to `lines` (same text; every old reader still works). Linter: `lintRefs` reports an unknown `say` character; `lintWalk.conditionsOf` handles a beat with an optional `if`. No state, save or reducer change.
- **UI:** new `ui/turns.ts` (`turnsOf`: a turn is a run of narration or of one character's lines), `hooks/useTurn.ts` (which turn is being read; reset per scene), `components/Dock.tsx` (portrait + spoken line + Continue + Choices panel), `components/Lines.tsx` (typed paragraphs). `SceneView` is now the middle: backdrop + story text (finished turns, with a speaker's name on what they said, plus the narration turn being typed) + Continue under it. `PlayScreen` reads the scene turn by turn: Continue goes to the next turn, from the last turn it leaves the scene; the Choices panel and `1-4` exist on the last turn only. `useTypewriter` takes a string key so each turn restarts it. `EndingScreen` uses the new `SceneView` props. `stage.css` rewritten for the new grid (story row, dock row); `who` no longer draws a portrait.
- **Tests (+10, 365 total):** `tests/ui/turns.test.ts` (new), stage tests rewritten (narration choice scene, `next` scene, speech turn, last speech turn with choices, spoken line kept in the middle), select (`beats`), schema (`say`), lint (unknown speaker), prologue (who talks in `p.dole`, `p.voice`), two assertions in `render.test.ts` / `renderPlay.test.ts` for the new markup.
- **Docs updated:** STORY_FORMAT (§2 `say`, §8), UI_UX (§2, §3 rewritten, §4, §5, §7, §9), ARCHITECTURE (§2, §8, §9), ROADMAP (M2 checkbox, D28), START_HERE (repo map), README (status), HANDOFF. `scripts/pack.ts` and `package.json` unchanged: the next session is still M3 s1 and its pack already exists.

## Decisions made

- D28 dialog layout and `say` beats (above). Earlier: D1-D27.

## Assumptions to confirm (small, easy to change)

- **Reading of the second sketch:** the red lines in the middle are the story text; the bottom frame holds portrait (left), the spoken line (center) and Choices (right). "The character, choices and dialog only show when a character talks" is built as: the portrait and the line show only while a character speaks; the **Choices panel also shows on the last turn of a choice scene when nobody is talking**, alone in the bottom bar, because most choice scenes end on narration and hiding them would soft-lock the game. If choices must appear only after a character speaks, end those scenes on a `say` beat (data only) or tell me and I will gate them.
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

- none known

## Known gaps

- **Default palette contrast:** `--blood` text is about 2.6:1 on `--bg` (lock chip, error title), under 4.5:1. High contrast fixes it. Fix the default in the M7 accessibility pass, or sooner if it reads badly.
- Focus is not moved on a scene change (falls back to the page; keys cover it).
- **Content budget at 85:15 is undecided** (ROADMAP open question 8). Decide before M4.
- The HUD is always visible, even in the dream (idea: fade it in after the first choice).
- No backdrop or portrait art exists yet (gradient and silhouette placeholders); the text box and panel are semi-opaque and the story text has a text shadow so art will stay readable, but contrast over real art is unchecked. The Background, Settings and Ending screens keep the old centered column.
- The middle story text grows with every finished turn of a scene (about 5 turns at most today); a very long scene would need a scroll area. Focus stays on the page (not on Continue) when a turn changes, as for scenes.
- The test chapter after the intro is mechanical (deleted in M4).
- Not built: text jitter / whisper lines at low Reason, haptics, sound, soften-violence variants (M7); Journal, Party cards, TierBanner, fail-cost hint line, confirm step for irreversible choices (M3+); `CAMP` is a stub (M4).

## Environment

- Node >= 22.12 (`nvm install 22 && nvm use 22`, then `npm install`). Vercel builds on Node 22. Push over SSH (`git@github.com:Dnggr/rot-reason.git`).

## Next 3 tasks (M3 session 1: social systems part 1)

Next pack: `npm run pack:m3s1`

0. **Owner first:** push this, open the Vercel preview on a phone and a wide screen, play the intro through `p.dole` and `p.voice`, and tick the M2 line in ROADMAP (layout, text sizes, typewriter pace, high contrast). Say if the story / dock layout reads differently from your sketch, or if choices must wait for a speaker (see Assumptions). Report anything with `?debug=1` and Copy debug report.
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
- UI story in the middle (D28): `say` beats, `turns`, `useTurn`, `Dock`, `Lines`, `SceneView` as the middle, dialog split in the intro; 365 tests.
- M2 s2 (UI shell part 2): Settings (+ `settings.ts`, `useSettings`), keyboard (`keys.ts`, `useKeys`), typewriter (`typewriter.ts`, `useTypewriter`), low-HP / low-Reason visuals (`motion.css`), `engine/debug.ts` (`DEBUG_JUMP` / `SET` / `ROLL`), rewind, DebugPanel in `src/debug/`, D25-D26; 350 tests.
