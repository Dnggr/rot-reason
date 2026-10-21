# HANDOFF (living log; update at the end of every session)

## Status
- **Phase:** M1 in progress. Session 1 (types, schema, rng) DONE. Next: M1 session 2 (conditions, effects, honor, checks, echoes).
- **Deployed:** https://rotandreason.vercel.app/ (Vercel, auto-deploys on push to `main`; build runs `npm run build` = `check` + `vite build`). Not redeployed this session; nothing user-visible changed.
- **Last verified:** `npm run check` green on Node 22 (typecheck, lint:story, 56 tests, rules; Vite 8, React 19, TS 7, Vitest 5, Zod 4). The new `rules` guard was negative-tested (tracked file under `node_modules/` and under `dist/` fail it; outside git it warns).

## This session (M1 s1: engine foundations)
- `src/engine/types.ts`: Condition, Effect, Choice, Scene, GameState, Action, SaveData, LogEntry and the small key unions (StatKey, ResKey, AttrKey, Tier, Phase, Mood, Tone). Tuples are `readonly`.
- `src/engine/schema.ts`: Zod schemas `conditionSchema`, `effectSchema`, `choiceSchema`, `sceneSchema`, `scenesSchema`. Parsed output is assignable to the `Scene` / `Effect` / `Condition` types (tested). Added dependency `zod` (D12).
- `src/engine/rng.ts`: seeded mulberry32, pure (`initRng`, `nextFloat`, `nextInt`, `d6`); matches the published reference sequence.
- Tests: `tests/engine/{types,schema,rng}.test.ts` (the STORY_FORMAT §6 example is a test fixture).
- `scripts/rules-check.ts`: fails if git tracks anything under `node_modules/` or `dist/`.
- Pack: added `PACKING` list and the `m1s2` preset in `scripts/pack.ts`, script `pack:m1s2` in `package.json` (about 21.7k tokens).
- Updated docs: START_HERE (Rule 0.5 file list, Zod note), ARCHITECTURE, STORY_FORMAT, REPOMIX, ROADMAP (M1 checkbox, D12, D13), HANDOFF.

## Decisions made
- D12: add `zod` ^4, `z.exactOptional` for optional fields. D13: task packs always carry `scripts/pack.ts`, `docs/REPOMIX.md`, `docs/ROADMAP.md`. Earlier: D1-D11 accepted.
- Task pack `m1s1` is kept until M1 is finished (Rule 0.5: delete task packs of finished milestones).

## Assumptions to confirm (small, easy to change)
- `GameState.name` added, because `START` carries the player name and the old state shape had nowhere to store it.
- `LogEntry` is `{ n, kind, text }` with kinds from the log format in ARCHITECTURE §7; `log.ts` may refine it.
- `SaveData` follows ARCHITECTURE §6; `checkpoint` is `null` until the first chapter gate; `savedAt` is epoch ms from the storage layer.
- Condition combinators are `{ all: [...] }`, `{ any: [...] }`, `{ not: c }`; operators are `>= <= > < ==`. A `lock` has no separate reason text yet (the UI derives it from the condition).
- `CHOOSE` carries `choice` (the id `a`-`d`); `CAMP.action` is a plain string until the camp hub is designed; `DEBUG_*` actions wait for M2.

## Story changes
- none

## Known bugs
- none

## Known gaps
- `scripts/lint-story.ts` still only checks duplicate ids. ARCHITECTURE §8 and STORY_FORMAT §8 describe the target; schema and graph checks are wired in M1 s3.

## Environment
- Node >= 22.12 required locally (`nvm install 22 && nvm use 22`, then `npm install`). Vercel builds on Node 22.
- `package-lock.json` changes with the new `zod` dependency: run `npm install` and commit the lockfile.
- Push over SSH (`git@github.com:Dnggr/rot-reason.git`).

## Next 3 tasks (M1 session 2: rules engine pieces)
Next pack: `npm run pack:m1s2`
1. `engine/conditions.ts` (`evaluate(cond, state) -> boolean`), `engine/effects.ts` (`apply(effect, state) -> {state, log}`) and `engine/log.ts` (typed entries), with tests. Add a test state factory (for example `tests/engine/fixtures.ts`, `makeState(overrides)`).
2. `engine/honor.ts` (`applyDeed`, `tierOf`, secret surfacing) with `src/story/honor.ts` (the deed table from HONOR.md §3), `engine/checks.ts` (d6 + attribute + trait bonus vs DC, using `rng.ts`) and `engine/echoes.ts` (schedule, due), each with tests.
3. End the session by creating `pack:m1s3` (reducer, select, endings, save, the 5-scene test story, schema + graph checks in `lint-story`, fuzz) and updating HANDOFF (Rule 0). Before measuring coverage, add a coverage provider (for example `@vitest/coverage-v8`) with a decision-log entry.
   - M1 DoD: >= 90% line coverage on engine, fuzz 1,000 runs clean, same seed + history replays identically.

## Verify
`npm install && npm run ready`

## Archive
<!-- older sessions go here; keep out of packs -->
- M0 (scaffold): Vite + React + TS strict scaffold, scripts (check, ready, build, lint:story, fuzz stub, rules, docs:check, pack*), repomix config and presets, Rule 0 (docs first, docs last), Rule 0.5 (pack next, D11). Decisions D7-D11. Deployed to Vercel. Node >= 22.12 fix (Vitest 5).
