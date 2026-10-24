# UI / UX

**Principle:** the story is the interface. Fast to read, one-thumb to play, clear about cost before the click.

## 1. Target
Mobile portrait first (360-430 px wide), one column. From 900 px up the Title and Play screens use the full-width stage layout of §3. Background, Settings, Ending and error screens stay a centered 560 px column. Works offline after first load (PWA later).

## 2. Screens
Live: Title (Continue, New game, Settings in a left column over a backdrop; a second tap confirms erasing a save), Background, Play (stage layout, §3; Menu and Settings top-right on wide screens, at the bottom on narrow ones), Settings (M2 s2), Ending, ErrorFallback. Next: Journal (M3), Camp (M4).

| Screen | Purpose | Key elements |
|---|---|---|
| Title | New / Continue / Settings | Continue shows day, chapter, honor tier |
| Background | Pick name + background | 3 cards: attributes, trait, kit, one-line hook |
| Play | The game | See layout below |
| Camp | Hub between spikes | Eat / Rest / Talk / Plan; party cards with trust |
| Journal | Memory of the run | Tabs: Deeds, People (trust/fear, status), Notes (clues, flags shown as text) |
| Ending | Epilogue | Ending title, one card per companion fate, stats recap, Share/Restart |
| Settings | Comfort | Text size S/M/L/XL, soften violence, reduce motion, high contrast, sound, reset saved game. Opens from Title or Play and goes back there; Reset appears only when opened from Title. Changes apply at once and are saved (`rr_settings_v1`). A first run follows the device's reduced-motion preference |

## 3. Stage layout (owner's sketches, 2026-10-24)
One full-screen **backdrop** per screen, with the UI laid over it (a visual-novel stage). Same DOM everywhere; CSS decides: a grid at 900 px and wider, one column below.

**Title** (all sizes): backdrop `title`; the title, tagline and the buttons (Continue, New game, Settings) stacked in a left column at the bottom-left.
```
+------------------------------------------------------+
|                 [ backdrop: title ]                  |
|                                                      |
|  Rot & Reason                                        |
|  Every choice costs something.                       |
|  [ Continue ]                                        |
|  [ New game ]                                        |
|  [ Settings ]                                        |
+------------------------------------------------------+
```

**Play, wide (>= 900 px):**
```
+------------------------------------------------------+
| [HUD: Day Phase  HP  Reason         ]    Menu Settings|
| [      Food Ammo Meds, honor meter  ]                |
| (toasts)        [ backdrop: place ]                  |
|                                                      |
| +--------+   +------------------+  +---- CHOICES ---+|
| |portrait|   | PLACE            |  | 1 Quiet  ...   ||
| | (who)  |   | narration text,  |  | 2 Brave  ...   ||
| |        |   | typewriter       |  | 3 Cold   ...   ||
| +--------+   | [Continue]       |  +----------------+|
|              +------------------+                    |
+------------------------------------------------------+
```
`next` scenes have no Choices panel: Continue sits inside the text box. `end` and `error` scenes use the Ending screen and the fallback.

**Play, narrow (< 900 px):** one column: HUD, portrait row, text box, toasts, Choices panel (thumb zone), Menu / Settings at the bottom. The backdrop fills the whole page behind it.

**Backdrop:** a gradient placeholder; an optional WebP at `public/bg/<place>.webp` (Play, keyed by the scene's `place`) or `public/bg/title.webp` (Title) is drawn over it. A missing file shows only the gradient, never an error. Keep each file at 80 KB or less (§10).

**Portrait:** one silhouette per id in the scene's `who` (the first is the largest on wide screens); it becomes an illustration later (§6 art pipeline).

## 4. Components (small, dumb)
Live: `Backdrop` (full-screen background layer), `StatBar` (vitals and resource chips), `HonorMeter`, `SceneView` (backdrop, portrait and the text box with the place caption and narration; `revealed` drives the typewriter; children, such as Continue, go inside the text box), `ChoiceList`, `ChoiceButton` (shows its 1-4 key), `Toast`, `ReportButton`, `ErrorFallback`, `ErrorBoundary`, and `SettingsScreen`. Planned: `PartyCard`, `CharacterCard`, `TierBanner` (M3). Each ≤ 80 lines, props in, events out.

## 5. Choice button spec
- Tone tag chip (left), text, right chips: cost (`-2 Food`), odds word (`Risky` / `Even` / `Likely`), lock icon.
- Locked: shows why. `select.currentView` gives `enabled`, `why: 'lock' | 'cost'` and, for a lock, the `lock` condition; `ui/lockReason.ts` words it (D20, no authored field): trait -> "Needs Medic"; honor / stat / attr / res / day -> "Honor 21+", "Honor -21 or lower"; tier -> "Respected or higher"; trust -> "Needs Nora's trust"; fear -> "Brick must fear you"; party -> "Needs Nora with you"; alive -> "Juno must be alive"; flag, secret, bg and all / any / not -> "Locked" (a flag name would spoil). Unaffordable: cost chip plus "Not enough". The button uses `aria-disabled`, not `disabled`, so the reason stays readable by screen readers. If a scene ever needs custom wording, add an optional `lockText` to `Choice` (not built).
- Min tap target 48 px; spacing 8 px; max 4 buttons.
- Keyboard (live, `ui/keys.ts`): `1-4` pick that choice (locked ones do nothing); `Space` finishes the typing, then continues a narration scene; `J` is reserved for the Journal (M3, does nothing yet). Keys do nothing inside a text field, with ctrl / meta / alt, on key repeat, and `Space` leaves a focused button to press itself. The choice buttons show their number on devices with a keyboard.
- While the text is still typing, a tap on a choice or Continue, or a `1-4` key, only finishes the typing; the next one acts. A double tap cannot run past a scene unread.
- Confirm step only for irreversible high-impact choices (kill, betray): press and hold 400 ms or second tap. Not built: it needs a scene flag (M3+).

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
| `--border` | #2c2f29 | card and chip outlines |

- **Type:** narration `Georgia, serif` 18px/1.55; UI `system-ui` 14-16px. No web fonts (speed, tokens).
- **Mood classes** change tint: `dread` (vignette + desaturate), `warm` (amber tint), `glitch` (see below).
- **Art pipeline:** v1 silhouettes (SVG/CSS) -> v2 AI or commissioned illustrations in WebP ≤ 80 KB each, 16:9 crop, keyed by `place`/`who`.

## 7. Juice (cheap and meaningful)
- Typewriter text (live, `MS_PER_CHAR` = 30 in `ui/typewriter.ts`, requestAnimationFrame): the whole text is in the DOM at once and the unshown tail is only made transparent, so layout never jumps and screen readers get it all. Tap the narration, press `Space`, or tap a choice or Continue to finish it. Off with Reduce motion. Choice buttons ease in, one after the other (live).
- Low HP (live, hp 2 or less): a red vignette pulse over the screen. Low Reason (live, under 30): a faint glow and flicker on the narration. Both stop pulsing with Reduce motion (the vignette stays, still). Not built: text jitter on random words, whisper lines, a disabled option labeled wrong. (The `glitch` text swap is in the engine.)
- Honor tier change: full-screen banner for 2 s.
- Toasts (live, `ui/toasts.ts`, built from the state diff, max 5, 2.5 s): "Honor +5", "-1 HP", "-1 Food", "Brick will remember that". The deed tag is not shown (the diff has none).
- Haptics on mobile (`navigator.vibrate`) for danger beats, behind the setting.
- Sound (later): ambient bed per mood, 3 stingers (danger, loss, relief). Muted by default until user taps.

## 8. Feedback clarity (so players trust the game)
- Show consequences of **past** choices in next scene (callback lines).
- Journal lists exactly what the game remembers (deeds, people). No hidden surprise rules about Rot or honor.
- Show check odds as words (live) and fail cost in a hint line before pick (not built: `ChoiceView` has no fail data; M3).

## 9. Accessibility
- Text size S/M/L/XL (live): `<html data-text>` changes `--story-size`, `--story-line`, `--ui-size` in `tokens.css`; chips, notes and the top bar scale from `--ui-size`.
- Contrast ratio ≥ 4.5:1; high-contrast mode (live, `<html class="hc">`) switches the palette tokens; every text pair in it is above 7:1 on black. Known gap in the default palette: `--blood` text is about 2.6:1 on `--bg` (the lock chip and the error title), below 4.5:1; high contrast fixes it, the default is for the M7 accessibility pass.
- Soften violence and Sound are stored and put on `<html>` (`soften`; no audio) but nothing reads them yet: no scene has a softer variant and there is no sound (M7).
- No color-only meaning (icons + labels for stats and tiers).
- `prefers-reduced-motion` honored (CSS media query in `motion.css`, and it sets the first-run default); the in-app Reduce motion also switches off the typewriter. All animation lives in `motion.css`, behind one switch.
- Focus is not moved on a scene change: the choices are rebuilt, so focus falls back to the page and `1-4` / `Space` keep working; Tab starts again from the top.
- Full text is in DOM immediately (screen readers); `aria-live="polite"` on the scene region.
- All actions reachable by keyboard; focus order top-bar -> text -> choices.

## 10. Performance
- No images shipped yet: the backdrops are gradients; `/bg/<name>.webp` files are picked up when they exist (§3). Later: lazy-load art for the next scene, WebP, ≤ 80 KB.
- Initial JS < 150 KB gzip; chapters code-split.
- Typewriter uses `requestAnimationFrame`, not `setInterval` per char. The debug panel is a separate lazy chunk (about 2 KB gzip); the initial JS is about 111 KB gzip.

## 11. Copy rules (UI strings in `ui/strings.ts`)
Short, verb-first: "Continue", "Rest (+Reason)", "Eat (-1 Food)". No jokes in system messages.
