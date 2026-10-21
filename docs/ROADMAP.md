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

### M1: Engine core (2-3 sessions)

- [x] types, schema (Zod), rng (M1 s1)
- [x] conditions, effects, log, bounds, honor.ts, checks.ts, echoes.ts (M1 s2; 100% line coverage measured on `src/engine`)
- [ ] reducer, select, endings.ts, save.ts
- [ ] Tiny test story (5 scenes, all effect kinds)
- [ ] `lint-story` + `fuzz` working on test story
- **DoD:** ≥ 90% line coverage on engine; fuzz 1,000 runs clean; same seed + history replays identically.

### M2: UI shell (2 sessions)

- [ ] Title, Background, Play, Settings screens; ChoiceList, StatBar, HonorMeter, Toast
- [ ] Autosave/Continue, ErrorFallback, DebugPanel + Copy report
- [ ] Mobile layout, keyboard controls, text size
- **DoD:** the test story is playable on a phone via Vercel preview; a deliberately broken scene shows fallback, not a blank screen.

### M3: Social systems (2 sessions)

- [ ] Trust/fear, party, companion approval table, secrets and reveal (engine side of secrets/reveal/owed: M1 s2; the trust hit and UI: M3)
- [ ] Journal (Deeds, People), tier banners
- [ ] Echo scheduling visible in debug
- **DoD:** golden test shows an unwitnessed deed surfaces later and applies the remainder.

### M4: Vertical slice (3-4 sessions)

- [ ] Write Prologue + Ch1 (~30 scenes) with callbacks, echoes, honor lines
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

## Open questions (M0 did not depend on these; decide before M2/M4)

1. **Art direction:** silhouettes first (recommended) or illustrated from day one?
2. **Protagonist:** fixed name/pronouns or fully player-chosen? (Plan assumes name choice, neutral narration.)
3. **Violence level:** default "soft" or "full" with a toggle?
4. **Language:** English only for v1 (UI strings isolated for later translation)?
5. **Rot/Reason:** keep both in v1, or ship Reason first and add Rot in M5? (Plan: Reason first.)
6. **Length:** target a ~30 min run (plan) or longer (40-60 min)?
7. ~~Stack confirmation~~ Resolved by starting M0 with D1-D6. Tell me if you want to change it.
