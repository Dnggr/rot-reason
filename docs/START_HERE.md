# START HERE (context capsule)

Paste this file first in any new Claude chat, then `HANDOFF.md`, then a repomix pack (see `REPOMIX.md`).

**Game:** Rot & Reason, a mobile-first zombie story game with choices and consequences. Web, Vercel. Repo: `github.com/Dnggr/rot-reason`
**Pitch:** The port city of Marrow Bay falls to "the Rot". The last evacuation ship leaves Pier 9 on Day 21 with six seats. Your deeds set your honor; honor decides who stands with you.
**Status:** always read `docs/HANDOFF.md` (newest truth).

## RULE 0: DOCS FIRST, DOCS LAST, PACK NEXT (applies to every AI session, no exceptions)

1. **Docs first.** Before any plan, code, or answer, read `START_HERE.md` and `HANDOFF.md`, then every doc the Doc map below lists for your task. If a needed doc is not in your context, say which one and stop; do not guess.
2. **Docs last.** After you change or fix anything (code, story, config, scripts), you must edit the docs to match what you actually did, in the same response:
   - `HANDOFF.md`: always (what changed, decisions, bugs, next tasks).
   - Every other doc your change touches (architecture, story format, storyboard, honor, UI, roadmap checkboxes, repomix presets, commands...).
3. **Docs are the source of truth.** If code and docs disagree, fix the disagreement now (update the doc, or flag it as a bug in `HANDOFF.md`). Never leave it for later.
4. **Return the updated docs as full files**, listed with the code files, under their `### docs/...` headings.
5. **Pack next.** Before you finish, create the repomix pack for the *next* session so the owner can switch Claude accounts with one command:
   - add a preset named `<milestone><session>` (letters and digits only, e.g. `m1s2`) to `scripts/pack.ts`, listing exactly the docs and files the next task needs (always keep START_HERE + HANDOFF; add `package.json`/`tsconfig.json` if the task touches dependencies or config; always add `scripts/pack.ts`, `docs/REPOMIX.md`, `docs/ROADMAP.md`, because the next session must create its own pack and may log a decision);
   - add `"pack:<name>": "tsx scripts/pack.ts <name>"` to `package.json`;
   - put this line in `HANDOFF.md`: ``Next pack: `npm run pack:<name>` ``;
   - delete task packs (`m*s*`) of finished milestones; generic packs (map, docs, core, story, ui, bug, chapter) stay;
   - state the command in the last line of your response.
6. Verify with `npm run ready` (`check` then `docs:check`). `docs:check` fails if code changed but `docs/HANDOFF.md` did not, or if the `Next pack` line, its npm script, or its preset is missing.

## Stack (decided; change only via the decision log in ROADMAP.md)

Vite 8 + React 19 + TypeScript 7 (strict) + Vitest 5 (+ `@vitest/coverage-v8`, added in M1 s3, D16). Plain CSS variables. localStorage saves. No router, no state library (`useReducer`). Chapters lazy-loaded. Zod 4 (added in M1 s1, D12) validates story data in `engine/schema.ts`. **Node ≥ 22.12** (Vitest 5 requires it; Vite 8 alone needs 20.19+). Use `nvm install 22 && nvm use 22`.

## Golden rules

1. **Engine is pure and deterministic.** No React, DOM, `Date`, or `Math.random` in `src/engine` or `src/story`. Randomness only via the seeded RNG. (`npm run rules` enforces it.)
2. **Story is data, logic is code, views are dumb.** `src/story` (data) / `src/engine` (logic) / `src/ui` (render). Never mix.
3. **One file, one job, ≤ 200 lines** (story chapter files ≤ 400). First line is a one-line purpose comment. (`npm run rules` enforces it.)
4. **All game text lives in `src/story`** (UI labels in `src/ui/strings.ts`). No prose in engine code.
5. **Gate:** every change passes `npm run check` (typecheck + lint:story + tests + rules). `npm run build` runs `check` first, so a broken story never deploys.
6. **No `any`, no silent `catch`.** Errors become log entries plus a visible fallback.
7. **Delete before adding.** No new dependency without a decision-log entry.
8. **No fake choices.** Every choice changes at least one of: honor, stat, flag, trust/fear, route.
9. **Fix the root cause**, then add a test or fuzz case that would have caught it.
10. **Keep docs short**, and keep them true (Rule 0).

## Repo map

```
docs/                 these files (read first, update last)
src/engine/           pure logic: reducer (+ choose, flow, init), select, conditions, effects, honor, rng, echoes, checks, choices, bounds, endings, save (+ stateSchema), ids, log, report
src/story/            data only: chapters/ (test chapter until M4), index (assembles the Story), characters, backgrounds, endings, flags, system, honor, traits
src/ui/               App, Game (screen router), strings, lockReason, toasts, names, storage, version; screens/ (Title, Background, Play, Ending); components/ (StatBar, HonorMeter, SceneView, ChoiceList/Button, Toast, ErrorFallback/Boundary, ReportButton); hooks/ (useGame + gameModel, useStory); styles/ (tokens, base, play)
src/debug/            DebugPanel (?debug=1)                         [M2 s2]; the report builder is src/engine/report.ts
scripts/              lint-story (+ lintCore/Graph/Refs/Walk), fuzz (+ fuzzRun), rules-check, docs-check, pack
tests/                engine unit tests + per-chapter golden paths + tests/ui (UI logic, render smoke)
public/               images (WebP), later audio
(root)                package.json, tsconfig.json, vite.config.ts, repomix.config.json, index.html
```

## Commands

| Command | Does |
|---|---|
| `npm run dev` | local dev server |
| `npm run check` | typecheck + lint:story + tests + rules (the gate) |
| `npm run ready` | `check` + `docs:check` (run before every commit, changes uncommitted) |
| `npm run build` | `check` + production build (Vercel runs this) |
| `npm run lint:story` / `rules` / `docs:check` | single gates |
| `npm run fuzz -- [runs=1000] [seed=1]` | random-playthrough bot; exits 1 on soft-lock, loop, invalid state, ERROR log or replay drift |
| `npm run coverage` | tests + line coverage of `src/engine` (fails under 90%) |
| `npm run pack:map\|docs\|core\|story\|ui` | generic repomix presets (output in `.repomix/`) |
| `npm run pack:<task>` (e.g. `pack:m2s2`) | task pack for the next session, made by the AI (Rule 0.5); named in HANDOFF `Next pack` |
| `npm run pack -- bug <files>` / `-- chapter <globs>` | generic presets with extra files |

## How Claude must answer (output contract)

- Start with: docs you read (one line), then a plan of at most 8 lines.
- Return the **full content** of every changed file (code **and docs**) under a `### path/to/file` heading. No `...` elisions, no partial snippets.
- End with: files changed, how to verify (`npm run ready`), and the next pack command (`npm run pack:<name>`), in at most 5 lines.
- Ask at most one clarifying question; otherwise state the assumption and proceed.
- Never invent files or IDs that are not in the pack; if something is missing, say what to pack.

## Doc map: open only what the task needs (plus START_HERE and HANDOFF, always)

| Task | Open |
|---|---|
| Write or change story scenes | STORYBOARD, STORY_FORMAT, CHARACTERS, HONOR |
| Engine / state / saves | ARCHITECTURE, STORY_FORMAT |
| UI / styling | UI_UX, ARCHITECTURE (UI section) |
| Balance / new mechanic | GAME_DESIGN, HONOR |
| Bug | HANDOFF + debug report + the files involved |
| Tooling / packs / workflow | REPOMIX, ARCHITECTURE |
| Planning | ROADMAP, GAME_DESIGN |
