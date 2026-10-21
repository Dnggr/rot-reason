# HANDOFF (living log; update at the end of every session)

## Status
- **Phase:** M0 DONE. Next: M1 (engine core).
- **Deployed:** https://rotandreason.vercel.app/ (Vercel, auto-deploys on push to `main`; build runs `npm run build` = `check` + `vite build`)
- **Last verified:** `npm run check` and `npm run build` green on Node 22 (Vite 8, React 19, TS 7, Vitest 5). Live site serves the app shell (title "Rot & Reason").

## This session
- Fixed engine mismatch: Vitest 5 needs Node >= 22.12 (local Node 20.20 printed EBADENGINE). `package.json` engines and START_HERE now say Node >= 22.12; lockfile refreshed.
- Pushed M0 to GitHub (switched `origin` to SSH: `git@github.com:Dnggr/rot-reason.git`; HTTPS password auth is not supported by GitHub).
- Connected Vercel; production deploy succeeded.
- Marked M0 done in ROADMAP; updated this file.

## Decisions made
- D1-D10 accepted (see ROADMAP decision log). No new decisions this session.

## Story changes
- none

## Known bugs
- none

## Next 3 tasks (M1: engine core)
1. `engine/types.ts` (GameState, Action, Scene, Effect, Condition), `schema.ts` (add `zod`), `rng.ts` (seeded mulberry32) with tests.
2. `conditions.ts`, `effects.ts`, `honor.ts`, `checks.ts`, `echoes.ts` with tests (honor rules from HONOR.md).
3. `reducer.ts`, `select.ts`, `save.ts`; a tiny test story (5 scenes, every effect kind); real `lint:story` graph checks and `fuzz`.
   - M1 DoD: >= 90% line coverage on engine, fuzz 1,000 runs clean, same seed + history replays identically.

## Verify
`npm install && npm run ready`

## Environment
- Node >= 22.12 required locally (`nvm install 22 && nvm use 22`, then `npm install`). Vercel already builds on Node 22.

## Git notes
- Push over SSH. If `ssh -T git@github.com` fails, see the key steps in chat history or GitHub docs.

## Archive
<!-- older sessions go here; keep out of packs -->
- M0 (scaffold): Vite + React + TS strict scaffold, scripts (check, ready, build, lint:story, fuzz stub, rules, docs:check, pack*), repomix config and presets, Rule 0 (docs first, docs last) added everywhere. Decisions D7-D10 added.
