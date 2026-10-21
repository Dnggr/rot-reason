# UI / UX

**Principle:** the story is the interface. Fast to read, one-thumb to play, clear about cost before the click.

## 1. Target
Mobile portrait first (360-430 px wide). Desktop = same layout centered, max width 560 px. Works offline after first load (PWA later).

## 2. Screens
| Screen | Purpose | Key elements |
|---|---|---|
| Title | New / Continue / Settings | Continue shows day, chapter, honor tier |
| Background | Pick name + background | 3 cards: attributes, trait, kit, one-line hook |
| Play | The game | See layout below |
| Camp | Hub between spikes | Eat / Rest / Talk / Plan; party cards with trust |
| Journal | Memory of the run | Tabs: Deeds, People (trust/fear, status), Notes (clues, flags shown as text) |
| Ending | Epilogue | Ending title, one card per companion fate, stats recap, Share/Restart |
| Settings | Comfort | Text size, soften violence, reduced motion, high contrast, sound, reset save |

## 3. Play layout (portrait)
```
+------------------------------+
| D7 Dusk   HP ***--  Reason 72|   top bar: day, phase, vitals
| Food 3  Ammo 1  Meds 0       |   resource chips
| [====|====] Respected        |   honor meter (split)
+------------------------------+
|                              |
|   [ scene art / silhouettes ]|   ~30% height, placeholder until art
|   (Nora)  (Brick)            |
+------------------------------+
| The crypt door is warm.      |   narration (serif), tap = skip typing
| Something knocks, slow...    |
|                              |
| Toast: Nora will remember.   |   auto-dismiss 2.5 s
+------------------------------+
| [Mercy] End her suffering    |   choices, thumb zone
| [Honest] Tell everyone       |   chips: tone tag, cost, odds
| [Quiet] Walk away            |
| [locked] Persuade (needs ..) |   disabled with the reason shown
+------------------------------+
|  Journal   Party   Menu      |
+------------------------------+
```

## 4. Components (small, dumb)
`TopBar`, `StatBar`, `ResourceChips`, `HonorMeter`, `SceneArt`, `SceneText`, `ChoiceList`, `ChoiceButton`, `Toast`, `PartyCard`, `CharacterCard`, `TierBanner`, `ErrorFallback`. Each ≤ 80 lines, props in, events out.

## 5. Choice button spec
- Tone tag chip (left), text, right chips: cost (`-2 Food`), odds word (`Risky` / `Even` / `Likely`), lock icon.
- Locked: shows why ("Needs Medic" / "Honor 21+"). Never hide a lock when seeing it teaches the player something; hide it only if it would spoil.
- Min tap target 48 px; spacing 8 px; max 4 buttons.
- Keyboard: `1-4` select, `Space` skips typing, `J` Journal.
- Confirm step only for irreversible high-impact choices (kill, betray): press and hold 400 ms or second tap.

## 6. Visual style
- **Mood:** soot, fog, weak warm light. Hand-cut silhouettes over gradients (cheap, consistent, readable).
- **Palette (CSS tokens):**

| Token | Hex | Use |
|---|---|---|
| `--bg` | #0e0f0d | page |
| `--panel` | #181a17 | cards |
| `--text` | #e6e2d3 | bone-white text |
| `--muted` | #8b8a7c | secondary |
| `--rot` | #7a8f3a | infection, Rot |
| `--blood` | #a3231f | danger, infamy |
| `--honor` | #d4a73a | honor, respect |
| `--reason` | #6f8fa6 | Reason, calm |

- **Type:** narration `Georgia, serif` 18px/1.55; UI `system-ui` 14-16px. No web fonts (speed, tokens).
- **Mood classes** change tint: `dread` (vignette + desaturate), `warm` (amber tint), `glitch` (see below).
- **Art pipeline:** v1 silhouettes (SVG/CSS) -> v2 AI or commissioned illustrations in WebP ≤ 80 KB each, 16:9 crop, keyed by `place`/`who`.

## 7. Juice (cheap and meaningful)
- Typewriter text (30 ms/char, skippable), softly eased choice buttons.
- Low HP: red vignette pulse. Low Reason (< 30): text jitter on random words, whisper lines, occasionally a disabled option labeled wrong.
- Honor tier change: full-screen banner for 2 s.
- Toasts: "Honor +5 (Mercy)", "Brick will remember that", "-1 Food".
- Haptics on mobile (`navigator.vibrate`) for danger beats, behind the setting.
- Sound (later): ambient bed per mood, 3 stingers (danger, loss, relief). Muted by default until user taps.

## 8. Feedback clarity (so players trust the game)
- Show consequences of **past** choices in next scene (callback lines).
- Journal lists exactly what the game remembers (deeds, people). No hidden surprise rules about Rot or honor.
- Show check odds as words and fail cost in a hint line before pick.

## 9. Accessibility
- Text size S/M/L/XL, line height scales.
- Contrast ratio ≥ 4.5:1; high-contrast mode switches palette tokens.
- No color-only meaning (icons + labels for stats and tiers).
- `prefers-reduced-motion` honored; setting also in-app.
- Full text is in DOM immediately (screen readers); `aria-live="polite"` on the scene region.
- All actions reachable by keyboard; focus order top-bar -> text -> choices.

## 10. Performance
- No images in v1. Later: lazy-load art for next scene, WebP, ≤ 80 KB.
- Initial JS < 150 KB gzip; chapters code-split.
- Typewriter uses `requestAnimationFrame`, not `setInterval` per char.

## 11. Copy rules (UI strings in `ui/strings.ts`)
Short, verb-first: "Continue", "Rest (+Reason)", "Eat (-1 Food)". No jokes in system messages.
