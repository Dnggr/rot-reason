# HANDOFF (living log; update at the end of every session)

## Status

- **Phase:** M1 in progress. Sessions 1 (types, schema, rng) and 2 (conditions, effects, log, honor, checks, echoes) DONE. Next: M1 session 3 (reducer, select, endings, save, test story, linter graph checks, fuzz).
- **Deployed:** https://rotandreason.vercel.app/ (Vercel, auto-deploys on push to `main`; build runs `npm run build` = `check` + `vite build`). Not redeployed this session; nothing user-visible changed.
- **Last verified:** `npm run check` green on Node 22 (typecheck, lint:story, 117 tests, rules; Vite 8, React 19, TS 7, Vitest 5, Zod 4). `src/engine` line coverage measured at 100% with a temporary `@vitest/coverage-v8` (not installed; the provider is an M1 s3 task). Checked in a repo rebuilt from the pack, so run `npm run ready` once locally (it also runs `docs:check` against your real git state).

## This session (M1 s2: rules engine pieces)

- `src/engine/`: `log`, `bounds`, `conditions` (`evaluate`), `effects` (`apply`, `applyAll`), `honor` (`tierOf`, `applyDeed`, `capScene`, `surface`), `checks` (`resolveCheck`), `echoes` (`schedule`, `tick`, `due`, `take`). `src/story/honor.ts` (DEEDS), `src/story/traits.ts` (TRAIT_BONUS). `types.ts` gained `GameState.owed`, `DeedTable`, `TraitBonuses`.
- Tests: `tests/engine/{log,bounds,conditions,effects,honor,checks,echoes,storyData}.test.ts` plus `fixtures.ts` (`makeState`); `types.test.ts` fixture gained `owed`.
- Pack: preset `m1s3` in `scripts/pack.ts`, script `pack:m1s3` in `package.json` (about 31.9k tokens).
- Docs updated: ARCHITECTURE, STORY_FORMAT (runtime rules §4-5), HONOR, GAME_DESIGN, ROADMAP (D14, D15), START_HERE, HANDOFF.

## Decisions made

- D14: story data tables are passed into engine functions, never imported. D15: `GameState.owed` and the deed-then-secret pairing rule. Earlier: D1-D13.
- Task packs `m1s1`, `m1s2` stay until M1 is finished (Rule 0.5).

## Assumptions to confirm (small, easy to change; details in STORY_FORMAT §5, HONOR §3)

- From s1, still open: `GameState.name`; `LogEntry` shape; `SaveData` per ARCHITECTURE §6; `all`/`any`/`not`; `CHOOSE` carries the choice id; `CAMP.action` is a string; `lock` has no reason text.
- New tag `lie_harm` (-6). `intimidate`/`cruelty_show` need authored `fear` effects. Diminishing returns hit every tag (100/50/25%).
- Unwitnessed remainder is owed to the next `secret` in the same list; `reveal` pays honor only (trust hit authored until M3).
- `applyDeed` has a scale (0.5/1/2) but the `honor` effect has no slot for it yet.
- Echo `after: N` = N scenes play, then it fires; reducer order `tick`, effects, `take`.
- Only Bruiser (grit +2) and Signal (wits +1) have bonus numbers; the story adds/removes those traits with the companion.
- `clamp` throws on NaN/Infinity: the reducer must turn it into an ERROR log plus fallback scene. Checks log as kind `FX`.

## Story changes

- none

## Known bugs

- none

## Known gaps

- `scripts/lint-story.ts` still only checks duplicate ids; schema and graph checks land in M1 s3 (ARCHITECTURE §8, STORY_FORMAT §8).
- Odds words (Risky / Even / Likely) are not implemented (select/UI). Reducer duties not yet written: reset `deedCount` and decay fear by 5 at each chapter change, call `capScene`, handle thrown errors.

## Environment

- Node >= 22.12 required locally (`nvm install 22 && nvm use 22`, then `npm install`). Vercel builds on Node 22.
- No new dependencies this session; `package-lock.json` is unchanged.
- Push over SSH (`git@github.com:Dnggr/rot-reason.git`).

## Next 3 tasks (M1 session 3: reducer, save, test story)

Next pack: `npm run pack:m1s3`

1. `engine/reducer.ts` (START, CHOOSE, CONTINUE, LOAD; CAMP a stub) and `engine/select.ts`. Order per ARCHITECTURE §4: `tick`, cost, `resolveCheck`, `applyAll(fx)`, `capScene`, time, `take` or `to`, `on`. Define the `Story` type (scenes + `DEEDS` + `TRAIT_BONUS`), `story/backgrounds.ts` and `story/characters.ts` (start npc trust/fear), reset `deedCount` and decay fear per chapter.
2. `engine/endings.ts`, `engine/save.ts` (serialize, migrate, replay), the 5-scene test story using every effect kind, schema + graph checks in `lint-story`, `fuzz.ts`.
3. Add a coverage provider (for example `@vitest/coverage-v8`) with a decision-log entry. End the session by creating the M2 pack (`m2s1`), deleting task packs `m1s*` (M1 done) and updating HANDOFF (Rule 0).
   - M1 DoD: >= 90% line coverage on engine, fuzz 1,000 runs clean, same seed + history replays identically.

## Verify

`npm install && npm run ready`

## Archive

<!-- older sessions go here; keep out of packs -->

- M0 (scaffold): Vite + React + TS strict scaffold, scripts (check, ready, build, lint:story, fuzz stub, rules, docs:check, pack*), repomix config and presets, Rule 0 (docs first, docs last), Rule 0.5 (pack next, D11). Decisions D7-D11. Deployed to Vercel. Node >= 22.12 fix (Vitest 5).
- M1 s1 (engine foundations): `types.ts`, `schema.ts` (Zod, D12), `rng.ts` (mulberry32), `rules-check` guard for tracked `node_modules/` / `dist/`, `PACKING` list and `m1s2` preset (D13), 56 tests.
