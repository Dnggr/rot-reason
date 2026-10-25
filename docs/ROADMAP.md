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

### M3: Social systems (2 sessions)

- [x] Trust/fear, party, companion approval table, secrets and reveal (M3 s1, D29): approval table (`story/approval.ts`) drives trust for the companions who see a deed; an unwitnessed deed keeps its tag with its secret and the party reacts when it surfaces; the dead cannot join; a companion walks out at trust -30 unless fear 60+ holds them; toasts for who joins / leaves. The Party cards are the next line.
- [ ] Journal (Deeds, People), Party cards, tier banners (M3 s2). The Journal's Deeds tab needs a stored deed list (HONOR §7); nothing keeps one yet
- [x] Echo scheduling visible in debug (the countdown has been in the debug panel since M2 s2)
- **DoD:** golden test shows an unwitnessed deed surfaces later and applies the remainder. The test is live (`tests/engine/social.test.ts`, "golden"; the real test chapter's steal -> confess path in `tests/story.test.ts`); tick this line when M3 s2 is done.
- **Bugs flagged in the M3 s1 review** (found by running or reading the code; [x] = fixed in M3 s1, [ ] = open, see HANDOFF Known bugs):
  - [x] A dead companion could rejoin the party: `['party','+nora']` after `['kill','nora']` was accepted (`relations.party` now refuses it with an ERROR).
  - [x] "X will remember that" toast fired for every npc whose fear merely faded at a chapter change; at the intro -> test chapter hand-over it named Brick, Calloway and Vera, whom the player never met (`ui/toasts.ts`: only trust changes or a fear that went up count).
  - [x] A fractional `stat` / `res` / `trust` / `fear` delta passed the schema and `lint:story` but made a state that fails `gameStateSchema` (a saved snapshot would not load, the fuzz bot would fail). The effect schema now wants whole numbers.
  - [ ] `SceneView` scrolls to the newest text keyed on `read.length * 1000 + done.length * 10 + now`; once the page holds 30 scenes (`MAX_READ`) that number repeats for two single-turn scenes in a row and the new text is not scrolled into view. Latent until M4 gives a run more than 30 scenes. Key it on the newest chunk's `key`. (Found by reading; not reproduced in a browser.)
  - [ ] `PlayScreen` puts `<header class="statbar">` (from `StatBar`) inside `<header class="hud">`: a header inside a header is invalid HTML and can give screen readers two banners. Make the outer one a `div`.
  - [ ] Companion perks are not tied to the party: `Bruiser` stays on the player after `['party','-brick']`, a `kill`, or now a walk-out, unless the scene remembers `['trait','-Bruiser']`; a walk-out has no scene to do that. Derive perk bonuses from party membership (a perk table) or have `relations` drop the perk trait with the companion; decide in M3 s2 / M5.

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

## Open questions (M0 did not depend on these; decide before M2/M4)

1. **Art direction:** silhouettes first (recommended) or illustrated from day one?
2. **Protagonist:** fixed name/pronouns or fully player-chosen? (Plan assumes name choice, neutral narration.)
3. **Violence level:** default "soft" or "full" with a toggle?
4. **Language:** English only for v1 (UI strings isolated for later translation)?
5. **Rot/Reason:** keep both in v1, or ship Reason first and add Rot in M5? (Plan: Reason first.)
6. **Length:** target a ~30 min run (plan) or longer (40-60 min)?
7. ~~Stack confirmation~~ Resolved by starting M0 with D1-D6. Tell me if you want to change it.
8. **Content budget at 85:15 (before M4):** STORYBOARD's chapters list ~7 key choices in ~22 scenes (about 30% choices). At 85:15 that becomes ~3 choices per chapter, or ~40 choices and ~220 narration scenes (a run of about 2 hours, against the ~30 minutes in pillar 4). Pick: fewer, heavier decisions (recommended), or a longer game.
