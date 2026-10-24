# Rot & Reason

Mobile-first zombie story game. Read, choose, live with it. Every choice costs something, and your **honor** decides who stands with you and who comes for you.

- **Genre:** choice-driven survival story (inspired by *Life in Adventure*)
- **Platform:** web, deployed on Vercel
- **Stack:** Vite + React + TypeScript, data-driven story engine
- **Status:** M1 engine core done; M2 UI shell code done (screens, autosave, Continue, error fallback, Settings, keyboard, typewriter, DebugPanel at `?debug=1`); the phone check is the owner's. The Title and Play screens use the stage layout from the owner's sketches: the story in the middle, and a bottom dock (portrait, spoken line, Choices) only while a character talks. See `docs/HANDOFF.md` for the newest state.

## Rule 0 (for humans and AI)
**Read `/docs` first. After you change or fix anything, update `/docs` to match.** Details: `docs/START_HERE.md`.

## Quick start
```
npm install
npm run dev        # play locally
npm run ready      # check + docs:check, run before every commit
```

## Read in this order
1. `docs/START_HERE.md`: context capsule (rules, stack, commands, output contract). Paste this first in any new Claude chat.
2. `docs/HANDOFF.md`: where we stopped, next tasks, known bugs.
3. Then only what the task needs (doc map in START_HERE).

## Docs
| File | Purpose |
|---|---|
| `START_HERE.md` | Rule 0, golden rules, repo map, commands, how Claude must answer |
| `GAME_DESIGN.md` | Pillars, loop, systems, techniques used |
| `HONOR.md` | Honor / reputation spec (Red Dead style) |
| `CHARACTERS.md` | Cast bible: traits, secrets, arcs |
| `STORYBOARD.md` | Main line: acts, chapters, beats, endings |
| `STORY_FORMAT.md` | How scenes/choices/effects are written |
| `ARCHITECTURE.md` | Code structure, anti-bug rules, debug tools |
| `UI_UX.md` | Screens, layout, style, accessibility |
| `REPOMIX.md` | Token-light packing + multi-account workflow |
| `ROADMAP.md` | Milestones, definition of done, decisions |
| `PROMPTS.md` | Copy-paste prompts for each kind of session |
| `HANDOFF.md` | Living session log |
