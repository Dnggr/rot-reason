# PROMPTS (copy, fill the brackets, paste)

Always attach: `docs/START_HERE.md`, `docs/HANDOFF.md`, and one repomix pack from `REPOMIX.md`.

## 0. Docs rule (put this at the top of EVERY prompt below)
```
DOCS RULE (START_HERE Rule 0): First read START_HERE.md, HANDOFF.md and the docs the doc map
lists for this task; name them in one line. If a needed doc is missing, tell me and stop.
After you change or fix anything, update the docs to match what you did (HANDOFF.md always,
plus every doc affected) and return them in full with the code. Code and docs must agree.
```

## 1. Bootstrap (new chat / new account)
```
[DOCS RULE]
Reply with: (1) current status in 3 lines, (2) the next 3 tasks, (3) which pack/files you
need if missing. Do not write code yet.
```

## 2. Implement a milestone task
```
[DOCS RULE]
Goal: [one sentence, e.g. "M1: implement engine/honor.ts + tests"].
Follow START_HERE rules and ARCHITECTURE. Plan in <= 8 lines, then return full files
(path headings, code AND docs), then verify steps (`npm run ready`). Add tests. At most one question.
```

## 3. Write story scenes
```
[DOCS RULE]
Write scenes for [chapter + beats from STORYBOARD, <= 6 scenes] in the STORY_FORMAT contract.
Use characters' voices from CHARACTERS. Each scene: >= 1 callback line, distinct choices,
honor tags where fitting, low/high honor line variants for key NPCs.
Return: chapter file (full), flags.ts additions (full file), STORYBOARD/HANDOFF updates
(echoes planted/paid, any beat that changed).
```

## 4. Continuity / consequence review
```
[DOCS RULE]
Review [chapter file] against STORYBOARD and CHARACTERS. List: contradictions, fake choices,
flags set-but-unused, missing callbacks, honor imbalance, dead ends. Then give fixes as full
files, and update the docs where the canon changed.
```

## 5. Bug report
```
[DOCS RULE]
Bug: [expected vs actual, 1-2 lines].
Debug report: [paste JSON]. Files: [output of `npm run pack -- bug <files>`].
Find the root cause first (explain in <= 5 lines), then fix, then add a test or fuzz case.
Return full changed files, and record the bug and fix in HANDOFF.md (plus any doc that was wrong).
```

## 6. UI task
```
[DOCS RULE]
Goal: [e.g. "ChoiceButton with tone tag, cost chips, locked reason"]. Follow UI_UX.md.
Mobile first, accessible, <= 80 lines per component, no game logic in components.
Update UI_UX.md if the spec changed.
```

## 7. Balance / design change
```
[DOCS RULE]
Proposed change: [mechanic or story change]. Check against pillars and HONOR.md.
List impacts on: engine, story data, linter, tests, docs. Then implement the minimum.
Update every doc you invalidate.
```

## 8. Refactor / size cleanup
```
[DOCS RULE]
Files over the limit: [`npm run rules` output]. Split by responsibility without changing behavior.
Keep tests green. Return all changed files in full, and update the repo map / architecture docs.
```

## 9. Handoff (end of every session)
```
[DOCS RULE]
Produce the final docs/HANDOFF.md (<= 1k tokens): status, what changed this session,
decisions made, story changes, known bugs, next 3 tasks, commands to verify.
Move older entries to the Archive section. Also list any other doc you changed this session.
Return the full file(s).
```

## 10. Doc audit (run every few sessions)
```
[DOCS RULE]
Compare docs/ with the code in the pack. List every place they disagree (commands, file
names, versions, behavior). Fix the docs (or file a bug in HANDOFF.md if the code is wrong).
Return the changed docs in full.
```
