# HONOR SYSTEM (Red Dead style)

## 1. Model
- **Honor** `H`: integer `-100..+100`, start `0`. One global score = your reputation.
- **Trust / Fear per NPC:** personal feelings that sit on top of honor. Honor sets first impressions; trust/fear set grudges and loyalty.
- **Faction standing:** derived, not stored: `standing = f(honor tier, faction values, key deeds)`.

## 2. Tiers
| Tier | Range | Label | World reaction |
|---|---|---|---|
| T1 | -100..-61 | **Infamous** | Strangers flee or beg. Wardens hostile. Reapers court you. Ambush scenes |
| T2 | -60..-21 | **Feared** | Compliance by fear, hushed talk, more hostile encounters |
| T3 | -20..+20 | **Unknown** | Neutral. People judge you by the moment |
| T4 | +21..+60 | **Respected** | Strangers help, discounts, allies vouch for you |
| T5 | +61..+100 | **Revered** | Crowds follow, doors open, enemies hesitate, "friends" events |

Tier changes show a full-screen beat once (e.g. "People begin to whisper your name.").

## 3. How honor changes
Every honor effect is a **tagged deed**, not a raw number: `deed(tag, witnessed)`. The delta comes from one table (`src/story/honor.ts`) so balance is changed in one place.

| Tag | Δ | Notes |
|---|---|---|
| `mercy` | +5 | spare, quick mercy kill of the suffering |
| `share` | +5 | give food/meds without being asked |
| `protect` | +8 | defend the weak at a cost |
| `sacrifice` | +12 | lose something big for others |
| `keep_word` | +6 | honor a promise when it hurts |
| `honest` | +2 | truth that costs you |
| `lie` | -3 | -6 if it harms someone |
| `steal` | -6 | from survivors (looting the dead = 0) |
| `abandon` | -10 | leave the wounded or a companion |
| `kill_surrender` | -12 | kill someone who yielded |
| `betray` | -15 | break trust with an ally |
| `torture` | -15 | |
| `murder` | -20 | kill an innocent |
| `intimidate` | -4 | threats; also grants **fear** on the target |
| `cruelty_show` | -8 | public example, grants fear in witnesses |

**Rules (all in `engine/honor.ts`):**
1. **Witness rule.** `witnessed=true` applies the full Δ. `witnessed=false` applies **half** now and stores a **secret**. If the secret surfaces, the remainder applies plus a trust hit.
2. **Diminishing returns.** The same tag repeated within one chapter gives 50% (then 25%). Prevents farming mercy.
3. **Scene cap.** Net honor change per scene is clamped to ±25.
4. **Context mods.** The scene may pass `x2` for a huge moment or `x0.5` for a minor one. Nothing else may scale it.
5. **Clamp** to -100..+100. Every change emits a log line: `HONOR +5 mercy witnessed -> 12`.

## 4. What honor does (visible consequences)
| Channel | Low honor (T1-T2) | High honor (T4-T5) |
|---|---|---|
| **Dialogue** | Intimidate/threaten options; people comply or snap | Persuade/vouch options; people open up |
| **Encounters** | Ambushes and bounty-hunter style scenes inserted via echo | Helper scenes: strangers share, allies arrive |
| **Factions** | Reapers friendly, Wardens/Congregation wary | Wardens/Congregation friendly, Reapers hostile |
| **Economy** | Take by force (cheaper, burns trust) | Trade at fair or discounted rates |
| **Companions** | Stay out of fear or leave when fear fades | Stay out of loyalty; unlock bond scenes sooner |
| **Narration** | Others' lines show fear ("Don't look at him.") | Others' lines show respect ("That's her. Let her through.") |
| **Endings** | Warden-of-the-Dead path | Beacon path |

Low honor is a **different playstyle, not a punishment**: it unlocks shortcuts, intimidation, Reapers alliance, and the "rule by fear" ending.

## 5. Companion approval
Each companion reacts to tags (see `CHARACTERS.md`): `+` raises trust, `-` lowers trust. Reactions fire only if the companion is present (or hears of it as a secret).

| Tag | Nora | Brick | Juno | Hart | Calloway |
|---|---|---|---|---|---|
| mercy | ++ | 0 | + | + | - |
| share | + | + | 0 | + | - |
| protect | + | ++ | + | 0 | 0 |
| honest | + | + | ++ | 0 | - |
| lie | - | - | -- | - | + |
| steal | - | 0 | 0 | -- | + |
| intimidate | - | + | - | - | + |
| kill_surrender | -- | - | - | -- | 0 |
| abandon | - | -- | - | - | + |
| sacrifice | + | + | + | ++ | 0 |

## 6. Fear (separate from honor)
`fear` is per-NPC `0..100`, raised by `intimidate` and `cruelty_show`. High fear gives compliance but low trust; fear decays 5 per chapter unless renewed. Honor-negative plus fear is the "Warden of the Dead" route.

## 7. Player-facing UI
- Center-split meter: red left (infamy), gold right (respect), marker at current value.
- Tier name under the meter. Toasts: `Honor +5 (Mercy)` or `Honor -3 (Lie, unseen)`.
- Journal tab "Deeds": last 20 deeds with tag, witnessed or not, and who reacted.

## 8. Implementation notes
- Pure function: `applyDeed(state, tag, witnessed, scale) -> {state, logLines}`.
- Tier is derived (`tierOf(honor)`), never stored.
- Unit tests: witness halving, diminishing returns, scene cap, clamp, secret surfacing.
- Story linter: warns if an unknown tag is used, or a chapter has no tag diversity.
