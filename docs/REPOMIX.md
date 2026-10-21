# REPOMIX WORKFLOW (cheap context, many Claude accounts)

Goal: give Claude **just enough** to work, in as few tokens as possible, and make any account able to pick up where another stopped.

## 1. Repo habits that keep packs small
1. Small files (≤ 200 lines) with a one-line purpose header, so Claude can choose by header alone.
2. Story split per chapter part. Pack only the chapter you are writing.
3. No generated files, lockfiles, images, fonts, or build output in packs.
4. No dead code, no long comments, no commented-out blocks.
5. Docs are short and layered: `START_HERE` (≤ 1.5k tokens) -> specific docs only when needed.
6. Types in one place (`engine/types.ts`) so other packs can reference instead of repeat.

## 2. Config (`repomix.config.json`, live since M0)
- `output.filePath`: `.repomix/pack.xml` (folder git-ignored), `style`: `xml`, `removeEmptyLines`: true, `topFilesLength`: 10 (shows the biggest files to trim)
- `ignore.customPatterns`: `package-lock.json`, `public/**`, `dist/**`, `.repomix/**`, images (`svg`, `webp`, `png`, `jpg`). Chapters are **not** ignored; presets choose them with `--include`.
- Verified in M0 against repomix via `npx` (flags used: `--include`, `-o`, `--compress`).

## 3. Presets (`scripts/pack.ts`, live since M0; every pack carries `START_HERE.md` + `HANDOFF.md`)
| Script | Includes | Use when | Token target |
|---|---|---|---|
| `pack:map` | whole `src` with `--compress` (signatures only) | New chat, "where is X?", architecture questions | ≤ 8k |
| `pack:docs` | all `docs/**` + README | Planning / design sessions (read every doc) | ~21k (measured in M0) |
| `pack:core` | ARCHITECTURE, STORY_FORMAT, `src/engine/**`, `tests/**` | Engine work | ≤ 15k |
| `pack:story` | STORY_FORMAT, STORYBOARD, CHARACTERS, HONOR, `src/story/flags.ts`, `src/story/characters.ts` | Writing scenes | ≤ 12k |
| `pack -- chapter <globs>` | STORY_FORMAT, STORYBOARD, flags + the globs you add, e.g. `src/story/chapters/ch2*` | Editing a chapter | ≤ 10k |
| `pack:ui` | UI_UX, ARCHITECTURE, `src/ui/**`, `src/engine/types.ts`, `src/engine/select.ts` | UI work | ≤ 15k |
| `pack -- bug <files>` | ARCHITECTURE + the files you list, e.g. `src/engine/honor.ts` | Debugging | ≤ 6k |

**Task packs (one per next session).** Besides the generic presets, the AI creates a task pack at the end of every session (START_HERE Rule 0.5): name `<milestone><session>` (e.g. `m1s2`), preset in `scripts/pack.ts`, script `pack:m1s2` in `package.json`, and the line ``Next pack: `npm run pack:m1s2` `` in HANDOFF.md. Run it, then give the new Claude account the single file `.repomix/<name>.xml` (it already contains START_HERE and HANDOFF). `docs:check` fails if the line, script or preset is missing. Task packs of finished milestones are deleted; generic packs stay.

Extra globs after the preset name are added to its include list: `npm run pack -- bug src/engine/honor.ts tests/engine/honor.test.ts`. Output goes to `.repomix/<preset>.xml`.

Raw commands, if you prefer no scripts:
```
npx repomix --include "docs/START_HERE.md,docs/ARCHITECTURE.md,src/engine/**" -o .repomix/core.xml
npx repomix --compress --include "src/**,docs/START_HERE.md" -o .repomix/map.xml
npx repomix --include "src/story/chapters/ch2*.ts,src/story/flags.ts,docs/STORY_FORMAT.md" -o .repomix/ch2.xml
```
Check size before pasting: repomix prints total tokens and the top files (`--top-files-len`). If a pack passes its target, split the biggest file or narrow `--include`.

## 4. Multi-account handoff protocol
**Starting a session on any account**
1. Run the command in HANDOFF's `Next pack:` line, then upload `.repomix/<name>.xml` (it includes START_HERE and HANDOFF; add other packs only if needed).
2. Use a prompt from `PROMPTS.md` (bootstrap, write scenes, implement, bug). Every prompt starts with the **docs rule**: read docs first, update docs last (START_HERE Rule 0).
3. State the single goal of the session in one sentence.

**Ending a session** (always)
1. Claude must already have returned the updated docs with its changes (Rule 0). Ask for the **handoff prompt** (in `PROMPTS.md`) to consolidate `HANDOFF.md`.
2. Paste files in, run `npm run ready` (check + docs:check), commit, push.
3. If anything changed in design or story, the docs changed in the same commit.

**Rules for consistency across accounts**
- `HANDOFF.md` and the docs are the memory; chats are disposable. If a chat changed anything and did not return updated docs, the session is not finished.
- One task per chat; new chat when it drifts (long chats lose rules).
- Claude returns **full files**; you paste them and run `npm run check`. Partial snippets cause drift.
- Decisions go in `ROADMAP.md` -> Decision log, not in chat only.
- Don't let two accounts edit the same file in parallel; use branches and merge via git.

## 5. Bug-report pack (smallest useful context)
Paste: (1) Debug report JSON (Copy debug report button), (2) `npm run pack -- bug <1-3 files>` of the files named in the log, (3) one sentence: expected vs actual. This avoids pasting the whole repo.

## 6. Token hygiene checklist
- [ ] Pack opened with the tokens summary; within target.
- [ ] No lockfile, no assets, no unrelated chapters.
- [ ] START_HERE ≤ 1.5k tokens, HANDOFF ≤ 1k tokens (trim old entries into "Archive" at the bottom, excluded from packs by a `<!-- archive -->` rule or moved to `docs/archive/`).
- [ ] Story files not bloated by repeated boilerplate (use helpers in `story/helpers.ts`).
