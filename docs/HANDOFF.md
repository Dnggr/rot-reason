# HANDOFF (living log; update at the end of every session)

## Status
- **Phase:** M0 scaffold built and verified locally. Waiting on: Vercel connection (needs the owner's account).
- **Deployed:** not yet (push, then import the repo in Vercel; steps below)
- **Last verified:** `npm run check` and `npm run build` green on Node 22 (Vite 8, React 19, TS 7, Vitest 5). `docs:check` and `rules` negative-tested. `npm run pack:map` verified with repomix via npx.

## This session (M0)
- Scaffolded Vite + React + TS (strict) with the folder structure from ARCHITECTURE.
- Added scripts: `check`, `ready`, `build` (runs check first), `lint:story` (loads registry, reports counts), `fuzz` (stub), `rules` (size/header/purity), `docs:check` (docs-last gate), `pack*` (repomix presets).
- Added `repomix.config.json`, `.gitignore`, placeholder `engine/types.ts`, empty chapter registry, smoke test, "Hello, Marrow Bay" screen.
- Added **Rule 0 (docs first, docs last)** to START_HERE, README, PROMPTS (docs-rule block on every prompt), REPOMIX, ROADMAP (Definition of Done), ARCHITECTURE (rule 13).
- Updated docs: START_HERE, README, PROMPTS, REPOMIX, ROADMAP, ARCHITECTURE, STORY_FORMAT, HANDOFF.

## Decisions made
- D1-D6 accepted by starting M0. New: D7 (Rule 0 + `docs:check`), D8 (`rules` replaces `size`), D9 (`scripts/pack.ts` presets), D10 (Zod deferred to M1). See ROADMAP decision log.
- Latest versions were installed (Vite 8, React 19, TS 7, Vitest 5), so START_HERE no longer says React 18.

## Story changes
- none

## Known bugs
- none

## Vercel steps (M0 DoD, owner action)
1. Push to GitHub (`git add -A && git commit -m "feat(m0): scaffold" && git push`).
2. vercel.com -> Add New Project -> import `Dnggr/rot-reason`.
3. Framework preset: Vite (auto). Build command `npm run build`, output `dist`, no env vars. Deploy.
4. Open the URL: you should see "Hello, Marrow Bay." Paste the URL here and M0 is done.

## Next 3 tasks
1. Owner: complete the Vercel steps above and confirm the live URL.
2. M1: engine types, Zod schema (add `zod`), rng, conditions, effects, reducer skeleton with tests; real `lint:story` graph checks and `fuzz`.
3. Answer the remaining open questions in ROADMAP (art, protagonist, violence, language, Rot/Reason, length) before M2/M4.

## Verify
`npm install && npm run ready`

## Archive
<!-- older sessions go here; keep out of packs -->
