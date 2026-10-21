# HANDOFF (living log; update at the end of every session)

## Status
- **Phase:** M0 DONE. Next: M1 session 1 (engine types, schema, rng).
- **Deployed:** https://rotandreason.vercel.app/ (Vercel, auto-deploys on push to `main`; build runs `npm run build` = `check` + `vite build`)
- **Last verified:** `npm run check` and `npm run build` green on Node 22 (Vite 8, React 19, TS 7, Vitest 5). `docs:check` negative-tested for the new Next-pack rule.

## This session
- Added **Rule 0.5 "pack next"**: the AI must end every session by creating a task pack (`npm run pack:<name>`), preset in `scripts/pack.ts`, script in `package.json`, and the `Next pack:` line below.
- `docs:check` now also fails if the `Next pack` line, its npm script, or its preset is missing.
- Added the first task pack `m1s1` (core docs + engine + config + tests) and added `package.json`/`tsconfig.json` to the `core` preset.
- Repo cleanup done by owner: `node_modules` was committed by mistake and removed from history; `.gitignore` restored.
- Updated docs: START_HERE, PROMPTS, REPOMIX, ROADMAP (D11), ARCHITECTURE, HANDOFF.

## Decisions made
- D11: Rule 0.5 pack-next (see ROADMAP). Earlier: D1-D10 accepted.

## Story changes
- none

## Known bugs
- none

## Environment
- Node >= 22.12 required locally (`nvm install 22 && nvm use 22`, then `npm install`). Vercel builds on Node 22.
- Push over SSH (`git@github.com:Dnggr/rot-reason.git`).

## Next 3 tasks (M1 session 1: engine foundations)
Next pack: `npm run pack:m1s1`
1. `engine/types.ts` (GameState, Action, Scene, Effect, Condition), `schema.ts` (add `zod`), `rng.ts` (seeded mulberry32), each with tests.
2. Add a guard to `scripts/rules-check.ts`: fail if any tracked file is under `node_modules/` or `dist/` (`git ls-files`).
3. End the session by creating `pack:m1s2` (conditions, effects, honor, checks, echoes) and updating HANDOFF (Rule 0).
   - M1 DoD: >= 90% line coverage on engine, fuzz 1,000 runs clean, same seed + history replays identically.

## Verify
`npm install && npm run ready`

## Archive
<!-- older sessions go here; keep out of packs -->
- M0 (scaffold): Vite + React + TS strict scaffold, scripts (check, ready, build, lint:story, fuzz stub, rules, docs:check, pack*), repomix config and presets, Rule 0 (docs first, docs last). Decisions D7-D10. Deployed to Vercel. Node >= 22.12 fix (Vitest 5).
