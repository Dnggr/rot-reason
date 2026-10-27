# ROADMAP

Build order: **foundation -> engine -> shell -> systems -> vertical slice -> rest of story -> polish.**
Never write Ch2+ text before the Prologue + Ch1 slice is fun and bug-free.

## Milestones

Each milestone ends with: `npm run check` green, deployed preview on Vercel, `HANDOFF.md` updated.

### M0: Scaffold (1 session) - DONE (live: https://rotandreason.vercel.app/)

- [x] Vite + React + TS strict, folder structure from ARCHITECTURE
- [x] Scripts: `dev check ready build test lint:story fuzz rules docs:check pack*`
- [x] `repomix.config.json`, `.gitignore` (.repomix), `rules-check`, `docs-check`, `pack` presets
- [x] Rule 0 (docs first, docs last) added to START_HERE, README, PROMPTS, enforced by `docs:check`
- [x] Vercel connected to the repo; "Hello Marrow Bay" deployed (https://rotandreason.vercel.app/)
- **DoD met:** live URL up, `npm run check` passes on empty story, Vercel builds with `npm run build`.

### M1: Engine core (3 sessions) - DONE

- [x] types, schema (Zod), rng (M1 s1)
- [x] conditions, effects, log, bounds, honor.ts, checks.ts, echoes.ts (M1 s2; 100% line coverage measured on `src/engine`)
- [x] reducer (+ choose, flow, init), select, endings.ts, save.ts (+ stateSchema), backgrounds, characters, flags, system scenes (M1 s3)
- [x] Tiny test story: 5 scenes, all 14 effect kinds (`src/story/chapters/test.ts`, deleted in M4)
- [x] `lint-story` (schema, graph, references) + `fuzz` working on the test story
- **DoD met (M1 s3):** 100% line coverage on `src/engine` (`npm run coverage`, threshold 90); `npm run fuzz` 1,000 runs clean (seeds 1 and 99); replay of seed + bg + name + history equals the live run (tested, and checked on every fuzz run).

### M2: UI shell (2 sessions) - code DONE; the phone check below is the owner's

- [x] Title, Background, Play, Ending screens; ChoiceList, StatBar, HonorMeter, Toast (M2 s1)
- [x] Settings screen (M2 s2): text size, soften violence (stored), reduce motion, high contrast, sound (stored), reset saved game
- [x] Autosave/Continue, ErrorFallback, error boundary + Copy debug report (M2 s1)
- [x] DebugPanel (M2 s2): state, log, jump / set / force-check / rewind through `DEBUG_*`, `window.__rr`, `?debug=1`, report with a note
- [x] Keyboard controls (`1-4`, `Space`, `J`), text size, typewriter, low-HP / low-Reason visuals (M2 s2)
- [x] Stage layout from the owner's sketches (UI session after M2 s2, D27): Title left column over a backdrop; Play as a visual-novel stage (HUD, portrait, text box, Choices panel)
- [x] Story in the middle, dock only while a character talks (UI session 2, D28): `say` beats, scenes read turn by turn, spoken lines kept in the middle text, web-novel page of earlier scenes
- [ ] Check on a phone via the Vercel preview (owner): layout, text sizes, typewriter pace, high contrast
- **DoD:** the test story is playable on a phone via Vercel preview; a deliberately broken scene shows fallback, not a blank screen.

### M3: Social systems (2 sessions + three bug-closing sessions) — code DONE (M3 s1, s2, s3, s4, s5); the phone check is the owner's

- [x] Trust/fear, party, companion approval table, secrets and reveal (M3 s1, D29): approval table (`story/approval.ts`) drives trust for the companions who see a deed; an unwitnessed deed keeps its tag with its secret and the party reacts when it surfaces; the dead cannot join; a companion walks out at trust -30 unless fear 60+ holds them; toasts for who joins / leaves
- [x] Journal (Deeds, People), Party cards, tier banners (M3 s2, D30): stored deed list (`GameState.deeds`, last 20, save v3 + migration), `journalOf` selector, `JournalScreen` drawn over the play page (button and `J`), `CharacterCard` for the party and the others (trust, fear, alive, perk), full-screen tier banner once per tier change (`story/tiers.ts`, `ui/tiers.ts`, `TierBanner`)
- [x] Echo scheduling visible in debug (the countdown has been in the debug panel since M2 s2)
- **DoD:** [x] golden test shows an unwitnessed deed surfaces later and applies the remainder (`tests/engine/social.test.ts`, "golden"; the real test chapter's steal -> confess path in `tests/story.test.ts`). Ticked in M3 s2.
- **Bugs flagged in the M3 s1 review** (found by running or reading the code; all fixed):
  - [x] A dead companion could rejoin the party: `['party','+nora']` after `['kill','nora']` was accepted (M3 s1: `relations.party` now refuses it with an ERROR).
  - [x] "X will remember that" toast fired for every npc whose fear merely faded at a chapter change (M3 s1: `ui/toasts.ts` counts only trust changes or a fear that went up).
  - [x] A fractional `stat` / `res` / `trust` / `fear` delta passed the schema and `lint:story` but made a state that fails `gameStateSchema` (M3 s1: the effect schema wants whole numbers).
  - [x] `SceneView` scrolled on `read.length * 1000 + ...`; once the page held 30 scenes (`MAX_READ`) that number repeated and new text was not scrolled into view (M3 s2: keyed on the newest chunk's `key`, `ui/turns.scrollKey`, test with a full page).
  - [x] `PlayScreen` put `<header class="statbar">` inside `<header class="hud">` (M3 s2: the outer one is a `div`; a test counts one `<header>`).
  - [x] Companion perks were not tied to the party: `Bruiser` stayed after `-brick`, a `kill` or a walk-out (M3 s2, D30: `PERKS` + `heldTraits` derive the bonus from living party members; the test chapter's `+Bruiser` / `-Bruiser` effects are gone).
- **Bugs flagged in the M3 s2 review** (found by running probes against the engine or by reading the code; all fixed in M3 s3, D31):
  - [x] **Silent join and leave.** `['trust','nora',-45]` then `['party','+nora']` in one effect list logged `party +nora` and `party -nora: walked out`, with no toast and no scene. M3 s3: `relations.party` refuses the join with an ERROR when the companion would walk out at once (`wouldLeave`, the same test as the walk-out); `lint:story` warns (`scripts/lintParty.ts`), also for a join followed by a trust drop in the same list (that order is allowed and logged).
  - [x] **A dead npc keeps changing.** After `['kill','nora']`, `['trust','nora',20]` and `['fear','nora',10]` still changed her numbers, and a probe found the chapter's fear fade did too (40 -> 35). M3 s3: `shift` logs and ignores the dead, and the fade in `changeChapter` skips them.
  - [x] **A spoken line is announced twice by a screen reader.** M3 s3: `SceneView`'s `aria-live` region holds only the narration turn being typed; finished turns are plain text outside it. Not tried with a screen reader.
  - [x] **New game skips the erase confirmation from the Ending and from the error fallback.** M3 s3: `ConfirmButton` (rule in `ui/confirm.ts`) on the Title, the Ending and the fallback's New game (`ui/fallback.ts`); Restart chapter and Title screen need no confirmation.
  - [x] **Journal honor is taken before the scene cap.** M3 s3: `capScene` takes the deed list from before the scene and `deeds.trimDeeds` gives the cap's correction back to the scene's newest same-direction deeds (never flips a sign, never touches an earlier scene's deeds).
  - [x] **People that were met but never changed are not listed.** M3 s3: `GameState.met` (save v4, `migrations.v3to4` starts it with the party), filled by `engine/met.ts` from a scene's `who` and visible `say` speakers on entry and by `trust` / `fear` / `party` effects; `journalOf` lists it.
- **Bugs flagged in the M3 s3 review** (probes against the engine unless it says "by reading"; all fixed in M3 s4, D32):
  - [x] **`lint:story` does not check `party` or `fear` ids in ending rules.** M3 s4: `lintRefs` checks `alive` / `party` / `trust` / `fear` ids in ending rules with the same set as scene conditions (`NPC_CONDITIONS`), and an ending's `bg` too.
  - [x] **`validState` accepts an impossible party.** M3 s4: `gameStateSchema` refines the party (at most `PARTY_MAX`, no repeats, every id a living npc); the fuzz bot checks the schema every step, so it is an invariant there too.
  - [x] **A v1 secret that pays honor on reveal leaves no deed in the Journal.** M3 s4: `reveal` adds one `unknown` deed carrying the honor paid when no deed tags are on record.
  - [x] **The typewriter keeps typing behind the Journal and the tier banner.** M3 s4: `useTypewriter` takes `paused` (true while an overlay is up; rule `typewriter.typing`).
  - [x] **Dying leaves only New game / Title.** M3 s4: the death ending (and Continue on a dead save) offers Restart chapter while a checkpoint exists (`fallback.canRetry`); the other endings stay final. Decided by me, not the owner: say so if you want it removed.
- **Bugs flagged in the M3 s4 review** (probes unless it says "by reading"; all fixed in M3 s5, D33):
  - [x] **Saves are checked for shape and the party only, not for references.** M3 s5: `Story` carries the flag registry (`story.flags`); `engine/stateRefs.refProblem` checks the scene, every echo and `resume` scene, `bg`, flags, the chapter (an echo or sys scene may sit in another chapter, but it must exist), `met` (known, no repeats), `owed` / `owedTags` keys (held secrets only), repeated secrets and the npc table (exactly the story's npcs); `validState(raw, story)` uses it, so a bad snapshot falls back to replay, then to the checkpoint. The fuzz bot runs `stateProblem` (shape + party + references) every step.
  - [x] **`party -ghost` for an unknown npc succeeds silently at run time.** M3 s5: `relations.party` refuses an unknown id for `-id` as for `+id` (ERROR, no change).
  - [x] **A ConfirmButton stays armed.** M3 s5: `ui/confirm.step(armed, 'tap' | 'blur' | 'timeout')`: the button disarms on blur and after `ARM_MS` (4 s); the timer is the sure part, since Safari does not focus a tapped button. Checked by the pure rule only, not by a click on a phone.
- **Bugs flagged in the M3 s5 review** (probes against the engine and the lint, run on the real story; [ ] = open, see HANDOFF Known bugs; none blocks M4):
  - [ ] **`lint:story` does not check `trait` ids.** Probe: `['trait','+Ghost']` as an effect and `['trait','Ghost']` as a condition both lint with 0 errors; the trait is added or never matches, silently. Fix: in `lintRefs`, a trait id must be a background trait, a `traitBonus` key or a `PERKS` trait.
  - [ ] **An echo `at: 'c9'` for a chapter no scene has passes the lint and never fires.** Probe: lint is clean and the echo waits forever (dead consequence). Fix: `lintRefs` (or `lintGraph`) errors when `at` is not the chapter prefix of any scene.
  - [ ] **`time` can move the day backwards.** Probe: `['time',{day:1}]` on day 5 sets day 1, with no log line or lint warning (the engine clamps to 1-21, not to the present). Fix: ignore or ERROR a day below the current one, and warn in the lint.
  - [ ] **A save may still name things the story lacks, in the parts D33 did not check.** Probe on the real story: `validState` accepts a deed with an unknown tag or an unknown npc in `who`, `deedCount` keys that are not deed tags, an unknown or repeated trait, an echo with an unknown `atChapter`, a party member who is not in `met`, and any `history` text (history is only tested when a replay is tried). Fix: extend `stateRefs.refProblem` with these (tag `unknown` is allowed for deeds).
  - [ ] **A save breaks when the story changes its ids.** By reading D33: a snapshot (and its checkpoint) that names an npc, flag, scene or background the new build lacks is refused; a replay may drift too; then the player has no usable save. All 9 npcs exist in `story/characters.ts` already, but M4 will rename and add scenes and flags. Fix, to decide before M4 ships to players: a story version stamp in the save with a clear "this save is from an older build" message, or healing a missing npc from `story.npcs` on load.

### M4: Vertical slice (3-4 sessions)

- [x] Prologue part 1, the intro (23 scenes, `chapters/prologue.ts`), written early in a story pass (D22-D24)
- [ ] Write Prologue part 2 (`p.street`, `p.gate`) + Ch1 (~30 scenes) with callbacks, echoes, honor lines; then delete the test chapter
- [ ] Camp hub template; Biscuit, Nora, first Calloway cameo
- [ ] Playtest 3 times (low / mid / high honor). Fix pacing
- **DoD:** 10-15 min playable; fuzz clean; golden paths for 3 honor styles; at least 3 echoes planted for later.

### M5: Mid-game (4-6 sessions)

- [ ] Ch2-Ch3 text; Rot meter and Reason effects; bond scenes
- [ ] Serum dilemma and Nora fate branches; manual save slots
- **DoD:** all Ch2-3 flags registered and read; fuzz and golden pass.

### M6: Endgame (4-6 sessions)

- [ ] Ch4 three routes; Screening; Ch5 siege and ending resolver; 6 endings and companion epilogues
- [ ] Balance pass using fuzz stats (ending distribution)
- **DoD:** every ending reachable via a golden path; ending distribution looks sane in fuzz (none at 0% or > 50%).

### M7: Polish and launch (2-3 sessions)

- [ ] Art pass (silhouettes -> illustrations), SFX/ambient, haptics, soften-violence variants
- [ ] Accessibility pass, Lighthouse ≥ 90, PWA/offline, Open Graph card
- [ ] Share-ending card, feedback link
- **DoD:** playtested by 3+ people; critical bugs = 0; deployed to production domain.

## Definition of Done (any task)

1. Typecheck, lint:story, tests pass (`npm run check`).
2. New logic has a test; new story has a golden or fuzz coverage path.
3. Files ≤ 200 lines; headers present.
4. **Docs updated (Rule 0):** every doc the change touches, plus `HANDOFF.md`. Verified by `npm run docs:check`.
5. Docs were read before the work started (named in the response's first line).

## Playtest checklist

- [ ] Does every scene have at least one visible consequence or callback?
- [ ] Are low-honor and high-honor runs both fun (not one strictly better)?
- [ ] Any scene > 90 words, or choice > 12 words?
- [ ] Any resource that is always 0 or always full?
- [ ] Can the player tell why a choice was locked?
- [ ] Any ending reached by < 2% of fuzz runs (unintended) or > 50%?

## Risks

| Risk | Mitigation |
|---|---|
| Story scope balloons | Vertical slice first; content budget in GAME_DESIGN; cut Rot/Reason depth before cutting endings |
| Continuity drift across Claude accounts | START_HERE + HANDOFF + flags registry + linter |
| Soft-locks from branching | Gate scenes, fuzz bot, golden paths |
| Token cost grows | Per-chapter files, repomix presets, size gate |
| Balance (honor too strong/weak) | Single honor table, scene cap, fuzz distribution reports |
| Tone / content concerns | Guardrails in GAME_DESIGN; soften-violence setting |

## Decision log

| # | Decision | Why | Status |
|---|---|---|---|
| D1 | Vite + React + TS, no router, `useReducer` | Minimal, easy deploy, fewer bugs. M0 installed latest: Vite 8, React 19, TS 7, Vitest 5 | Accepted (M0) |
| D2 | Story as typed TS data (not Ink/JSON) | Type safety, easy for Claude to write, lintable | Accepted (M0) |
| D3 | Pure deterministic engine + seed + history replay | Reproducible bugs | Accepted (M0) |
| D4 | No backend, localStorage only | Scope, cost | Accepted (M0) |
| D5 | Plain CSS variables, no Tailwind | Fewer tokens, small bundle | Accepted (M0) |
| D6 | One global honor + per-NPC trust/fear | Red Dead feel without complexity | Accepted (M0) |
| D7 | Rule 0: AI reads docs first, updates docs last; `docs:check` gate | Docs stay true across many Claude accounts | Accepted (M0) |
| D8 | `npm run rules` replaces `size`; purity + size + header in one script | One gate for golden rules 1 and 3 | Accepted (M0) |
| D9 | Repomix presets in `scripts/pack.ts` (not 10 npm scripts); every pack includes START_HERE + HANDOFF | One place to edit, docs always travel with code | Accepted (M0) |
| D10 | Zod deferred to M1 (first real schema) | Delete before adding | Accepted (M0); done by D12 |
| D11 | Rule 0.5 "pack next": AI ends each session with a task pack `npm run pack:<milestone><session>`, enforced by `docs:check` | One-command context for switching Claude accounts | Accepted (M0+) |
| D12 | Add `zod` ^4 (runtime dependency). `engine/schema.ts` validates story data; optional fields use `z.exactOptional` to match `exactOptionalPropertyTypes` | First real schema (D10); one validator for dev, `lint:story` and tests; Condition/Effect tuples stay typed | Accepted (M1 s1) |
| D13 | Every task pack includes `scripts/pack.ts`, `docs/REPOMIX.md`, `docs/ROADMAP.md` (`PACKING` list) | `m1s1` lacked them, so the session could not create the next pack or log a decision | Accepted (M1 s1) |
| D14 | Story data tables (deeds, trait bonuses) are passed into engine functions, never imported by the engine | Keeps ARCHITECTURE §1 (engine imports story types only); tests use tiny tables | Accepted (M1 s2) |
| D15 | `GameState.owed` (secret id -> honor still owed); an unwitnessed deed's remainder goes to the next `secret` in the same effect list | The effect vocabulary has no deed-to-secret link, and this needs no new syntax | Accepted (M1 s2) |
| D16 | Add `@vitest/coverage-v8` (devDependency), `npm run coverage`, line threshold 90 on `src/engine` | M1 definition of done needs a measured number | Accepted (M1 s3) |
| D17 | `Story` = `StoryTables` (start, deeds, traitBonus, backgrounds, npcs, endings) + `scenes` map, assembled in `src/story/index.ts` and passed into `reduce` / `currentView`. Fallback scenes `sys.missing`, `sys.error`, `sys.death` live in `story/system.ts`. hp 0 always goes to `sys.death` | Keeps D14 (engine imports no story data) and golden rule 4 (no prose in engine) | Accepted (M1 s3) |
| D18 | A due echo replaces the transition target and `GameState.resume` remembers it; echo scenes (tag `echo`) exit only with `'$resume'`. Echoes may fire before an ending, never before a system scene | Echo scenes cannot know where the player was heading; without a return slot an echo would drop the story line | Accepted (M1 s3) |
| D19 | `SaveData` gains `bg` and `name`; replay rebuilds a game from `seed + bg + name + history` ("scene:choice", "scene:>"); `makeSave` moves the checkpoint at `gate` scenes | Replay needs the start inputs even when the snapshot is unusable (ARCHITECTURE §6) | Accepted (M1 s3) |
| D20 | The reason text of a locked choice is derived in the UI from its `lock` condition (`ui/lockReason.ts`); `ChoiceView` carries the condition; flags, secrets and nested conditions read "Locked" so a lock never spoils. No authored field (an optional `lockText` can be added if a scene needs custom wording) | Settles the M1 s3 question with no schema or story change; every UI_UX §5 example is derivable | Accepted (M2 s1) |
| D21 | UI shell state: one `useGame` hook over a `useReducer` of `{ screen, game, checkpoint, toasts }` (`gameModel.uiReducer` wraps `reduce`); autosave runs after every state change on the play screen, synchronously (no debounce); the debug report builder lives in `engine/report.ts` (pure) so the error boundary can use it without reading `debug/` | No router or state library (D1); a save is about 15 KB so debouncing buys nothing and risks losing the last choice; `debug/` stays unread by other layers (ARCHITECTURE §1) | Accepted (M2 s1) |
| D22 | Story first: the target is **85:15 story to game**. A chapter of 8+ scenes gets a lint warning when more than 15% of its scenes ask for a choice (`scripts/lintTone.ts`; it counts authored scenes, and `tests/prologue.test.ts` checks the real routes). Added to GAME_DESIGN (pillar 5), STORY_FORMAT §7-8, START_HERE rule 11. | The owner wants storytelling, suspense and thrill, "not a game at all". Narration scenes already exist (`next` + Continue), so no engine change. | Accepted (story pass) |
| D23 | In-world nobody has a word for the dead who walk. "zombie" and "undead" in story text are a lint error. Characters say "the sick" / "them" until the Haven broadcast names "the Rot" (Day 1 night); Juno notices Haven had the name first (seed for `c5.truth`). The Background screen no longer asks "before the Rot" (now "before today"). | The player and the reader must be as confused as the protagonist (owner's idea). | Accepted (story pass) |
| D24 | The intro is Prologue part 1 (`chapters/prologue.ts`, start scene `p.dream`) and hands over to the test chapter (`t.wake`) until M4 writes Prologue part 2 and Ch1. Tests that exercise the fixture start at `t.wake` through `tests/engine/testStory.ts`. `t.wake`, `t.echo`, `t.gate` got conditional lines for the intro's flags. Dole is a registered NPC (`dole`) so he can show as a silhouette. | Pulls the story forward without rewriting 100+ fixture tests; the fixture is deleted in M4 anyway. | Accepted (story pass) |
| D25 | `DEBUG_JUMP` / `DEBUG_SET` / `DEBUG_ROLL` are engine actions in `engine/debug.ts`; `DEBUG_REWIND` is a UI action (`gameModel.rewind`, it replays history through `save.replay`, and `reducer` importing `save` would be a cycle). `uiReducer(story, debug)` drops all `DEBUG_*` unless the panel is mounted. The panel lives in `src/debug/`, is loaded lazily by `main.tsx` (dev or `?debug=1`) and handed to `<App debugPanel>`; `ui` never imports `debug/`. `LogEntry.kind` gains `DEBUG`. Force-check steers the rng (`DEBUG_ROLL`) instead of adding a force field to `GameState`. Rewind refuses a run that history no longer reproduces | Keeps the engine pure and saves unchanged; ARCHITECTURE §1 (nothing reads debug/) stays true in spirit; no new state shape | Accepted (M2 s2) |
| D26 | UI behavior: the typewriter lives in `PlayScreen` (30 ms per character, `requestAnimationFrame`, whole text always in the DOM, tail made transparent); while it types, a tap or `1-4` only finishes it; `Space` finishes it, then continues a narration scene; Settings are stored in `rr_settings_v1` (strict schema, damaged -> defaults and a visible notice), applied to `<html>` as `data-text` and the classes `hc` / `reduce-motion` / `soften`; first run follows `prefers-reduced-motion`; Soften violence and Sound are stored only (nothing to soften or play until M7). No new dependency (Zod was already in) | Story-first pacing without losing accessibility or the double-tap safety; settings that are honest about what they do | Accepted (M2 s2) |
| D27 | Stage layout (owner's sketches): every Title and Play screen has a full-screen `Backdrop` (gradient now, optional `public/bg/<name>.webp` later, missing file = gradient). Title: title and buttons in a left column. Play: HUD top-left, Menu / Settings top-right, portrait bottom-left, text box bottom-center (Continue inside it), Choices panel on the right at 900 px and wider; one column below. `SceneView` is `display: contents` so its parts are grid items of `.play`. New file `styles/stage.css` (5 CSS files). No new dependency, no engine or story change | Matches the owner's sketches with CSS and three small components; art can drop in later with no code change; the typewriter, keys, tests and the low-HP vignette are untouched | Accepted (UI session, 2026-10-24) |
| D28 | Dialog layout (owner's second sketch): the story (narration) is in the middle of the Play screen; the bottom dock (speaker's portrait, their line, Choices panel) exists only while a character talks or choices are offered, and a spoken line stays in the middle text, under the speaker's name, after it was said. The middle is a web-novel page: scenes already read stay above (UI state `read`, last 30, not saved), with the choice taken, and it scrolls. Story data gets a `say` beat, `{ say: <character id>, text, if? }`; `Beat` type, Zod schema, `select.currentView` (new `beats`, `lines` kept), `lintRefs` (unknown speaker = error) change. The UI groups beats into turns (`ui/turns.ts`, `useTurn`) and reads a scene turn by turn; choices show on the last turn only. `who` no longer draws a portrait. The intro's dialog (Dole, Juno) and the test chapter's Nora line were split into `say` + narration beats. No new dependency | A scene's text mixed narration and quotes in one string, so the UI could not know who talks, and guessing from quote marks is fragile; explicit data is cheap to lint and to debug (golden rule 2); no engine state change, so saves and replays are untouched | Accepted (UI session 2, 2026-10-24) |
| D29 | Companion approval and secret reveal (M3 s1). (1) The HONOR §5 table is story data (`story/approval.ts`, one `+` = 5 trust) in `StoryTables.social` with the walk-out line (trust -30, fear 60), passed to `apply` / `applyAll` as an optional 4th argument (D14; default `NO_SOCIAL` keeps old callers and tests unchanged). (2) A witnessed deed moves the trust of the companions in the party then, scaled by the deed's repeat factor; an unwitnessed deed moves nobody. (3) New `GameState.owedTags` (secret id -> deed tags it hides) is filled by `applyAll` next to `owed`; `reveal` pays the honor and the party present at that moment reacts in full. (4) `SAVE_VERSION` 2 with `migrations.v1to2` (empty `owedTags`). (5) The dead cannot join; at the end of every effect list and at a chapter change a companion with trust <= -30 and fear < 60 leaves the party. (6) Effect deltas for stat / res / trust / fear must be whole numbers. (7) Toasts: "X joins / leaves you"; "will remember" only for a trust change or a fear increase | The effect vocabulary had no deed-to-secret link and no per-companion opinion, so the trust hit could only be hand-authored per scene and would drift; a table in one place balances like `DEEDS`; storing the tag (not a number) lets the reaction follow the real deed, including repeats and several deeds under one secret; a save field needs a version step or old saves silently lose data | Accepted (M3 s1) |
| D30 | Journal, Party cards, tier banners, perks (M3 s2). (1) `GameState.deeds` (the last 20: `{ tag, witnessed, surfaced, day, delta, who }`, `engine/deeds.ts`) is written by `effects.apply` for every deed, and by `reveal` for each hidden deed (`surfaced`); `SAVE_VERSION` 3 with `migrations.v2to3` (empty list). (2) `engine/journal.journalOf` is the Journal's selector (the UI reads no story data); `JournalScreen` (tabs Deeds, People) and `CharacterCard` are drawn by `PlayScreen` over the play page, so the scene being read keeps its turn; `J` opens and closes it. (3) Tier banner: `uiReducer` sets `UiState.banner` from `ui/tiers.tierBanner` when honor enters a new tier (not saved; dismissed by tap, Continue or 3 s); the line per tier is story data (`story/tiers.ts`, `StoryTables.tiers`). (4) Companion perks come from the party: `StoryTables.perks` (`story/traits.ts` `PERKS`: companion id -> trait + card text, only for perks the engine applies) and `checks.heldTraits`; the test chapter no longer adds or removes `Bruiser`. (5) `engine/actions.ts` split out of `types.ts` (200-line rule). (6) `UiState.screen` gains `journal`. No new dependency | The Journal needed a stored list (HONOR §7) and nothing kept one; deriving perks from the party removes a class of stale-perk bugs for every future companion and needs no authoring; the overlays keep the typewriter and turn state, so opening the Journal mid-scene does not restart the scene | Accepted (M3 s2) |

## Open questions (M0 did not depend on these; decide before M2/M4)

1. **Art direction:** silhouettes first (recommended) or illustrated from day one?
2. **Protagonist:** fixed name/pronouns or fully player-chosen? (Plan assumes name choice, neutral narration.)
3. **Violence level:** default "soft" or "full" with a toggle?
4. **Language:** English only for v1 (UI strings isolated for later translation)?
5. **Rot/Reason:** keep both in v1, or ship Reason first and add Rot in M5? (Plan: Reason first.)
6. **Length:** target a ~30 min run (plan) or longer (40-60 min)?
7. ~~Stack confirmation~~ Resolved by starting M0 with D1-D6. Tell me if you want to change it.
8. **Content budget at 85:15 (before M4):** STORYBOARD's chapters list ~7 key choices in ~22 scenes (about 30% choices). At 85:15 that becomes ~3 choices per chapter, or ~40 choices and ~220 narration scenes (a run of about 2 hours, against the ~30 minutes in pillar 4). Pick: fewer, heavier decisions (recommended), or a longer game.
| D31 | Close the M3 bug list (M3 s3). (1) `party +id` is refused with an ERROR when the companion would walk out at once (`relations.wouldLeave`, the walk-out test); `lint:story` warns (`lintParty`). (2) `shift` ignores the dead and the chapter fear fade skips them. (3) `GameState.met` (save v4, `migrations.v3to4` = the party) filled by `engine/met.ts` from `who` / visible `say` speakers on scene entry and by `trust` / `fear` / `party` effects; People lists it. (4) `capScene(before, state, prior)` trims the scene's deeds by what the cap took (`deeds.trimDeeds`). (5) `SceneView`'s `aria-live` region holds only the turn being typed. (6) `ConfirmButton` + `ui/confirm.ts` on Title, Ending and the fallback's New game (`ui/fallback.ts`). No new dependency | Each was a flagged bug with a probe or a reading; refusing a join keeps one rule (a join cannot silently undo itself) and lets the author see it; `met` follows the ROADMAP's own plan; trimming the newest deeds keeps the list equal to the meter without storing a second number | Accepted (M3 s3) |
| D32 | Close the M3 bug list again (M3 s4). (1) `lintRefs` checks `party` / `fear` ids (and `bg`) in ending rules like scene conditions. (2) `gameStateSchema` refines the party: at most `PARTY_MAX`, no repeats, living npcs only. (3) `reveal` adds an `unknown` deed when honor was paid with no deed tags on record. (4) `useTypewriter(…, paused)` waits under the Journal and the tier banner. (5) The death ending offers Restart chapter (`fallback.canRetry`). Three new bugs flagged. No new dependency, no save change | Each was a flagged bug with a probe or a reading; the party rule is the same one `party` and `kill` already keep, so a valid run never trips it; a death that can only start over wastes the checkpoint the game keeps for exactly that | Accepted (M3 s4) |
| D33 | Close the M3 s4 bug list (M3 s5). (1) `Story.flags` (the registry) is part of the assembled story; `engine/stateRefs.refProblem` + `stateSchema.stateProblem` / `validState` refuse a save whose ids the story does not have; the fuzz bot checks it every step. (2) `party -id` of an unknown npc is an ERROR. (3) `ConfirmButton` disarms on blur and after 4 s (`ui/confirm.step`, `ARM_MS`). (4) `docs/STORYLINE.md`: the live story as a readable map with the owner's `-joshua` lines, kept by the AI (START_HERE Rule 0). Five new bugs flagged. No new dependency, no save version change | Each was a flagged bug with a probe or a reading; the npc table must match the story exactly because a missing npc turns into a run-time ERROR later, and the cost (saves tied to the story's ids) is flagged as a bug to decide before M4 ships; the owner wanted the story visible and editable in one file | Accepted (M3 s5) |
