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

Tier changes show a full-screen banner once (live since M3 s2, D30): the tier word and one line from `src/story/tiers.ts` (entering T2: "People begin to whisper your name."). A tap, Continue or 3 s dismisses it. One banner per move, for the tier honor ends in; it is not saved, so a reload while it shows loses it.

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
| `lie` | -3 | a lie that harms someone is `lie_harm` (-6) |
| `lie_harm` | -6 | |
| `steal` | -6 | from survivors (looting the dead = 0) |
| `abandon` | -10 | leave the wounded or a companion |
| `kill_surrender` | -12 | kill someone who yielded |
| `betray` | -15 | break trust with an ally |
| `torture` | -15 | |
| `murder` | -20 | kill an innocent |
| `intimidate` | -4 | threats; also grants **fear** on the target (author a `fear` effect) |
| `cruelty_show` | -8 | public example, grants fear in witnesses (author `fear` effects) |

**Rules (all in `engine/honor.ts`):**

1. **Witness rule.** `witnessed=true` applies the full Δ. `witnessed=false` applies **half** now (halves round away from zero) and the rest is **owed** to the `secret` that follows the deed in the same effect list (STORY_FORMAT §5). When the secret is revealed, the remainder applies and the companions in the party at that moment react to the hidden deed in full (§5).
2. **Diminishing returns.** The same tag repeated within one chapter gives 100%, then 50%, then 25% (3rd use and later), for every tag. Counted in `deedCount`; the reducer resets it at each chapter change (live since M1 s3). Prevents farming mercy.
3. **Scene cap.** Net honor change per scene is clamped to ±25 (`capScene(before, state, prior)`: the reducer passes the honor value from before the scene's effects and the deed list from before them; a pick and a scene's `on` effects each get their own cap). What the cap takes is taken off the deeds the scene added too (§7).
4. **Context mods.** `applyDeed` takes a scale of `x2` (huge moment) or `x0.5` (minor one). Nothing else may scale it. The `honor` effect has no scale slot yet, so effects use `x1` until a scene needs one.
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

Each companion reacts to tags (see `CHARACTERS.md`): `+` raises trust, `-` lowers trust. Live since M3 s1 (D29, `story/approval.ts`, `engine/relations.ts`): one `+` is **5 trust**, `++` is 10, `-` -5, `--` -10; `0` is no reaction.

- **Present** = in the party when the deed lands. A *witnessed* deed moves them at once, scaled by the deed's repeat factor (100%, 50%, 25%; halves round away from zero), so repeating mercy cannot farm trust.
- **Hears of it as a secret**: an unwitnessed deed moves nobody. Its tag is stored with the secret (`GameState.owedTags`); on `reveal` the companions in the party *at that moment* react in full (no repeat scaling), on top of the honor the secret owed.
- Dead companions never react. Tags not in the table below (`keep_word`, `lie_harm`, `betray`, `torture`, `murder`, `cruelty_show`) move nobody yet; Biscuit has no row (open, HANDOFF).

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

`fear` is per-NPC `0..100`, raised by `intimidate` and `cruelty_show` (authored `fear` effects; the approval table moves trust only). High fear gives compliance but low trust; fear decays 5 per chapter unless renewed (done in `engine/flow.ts` on a chapter change).

**Walk-out.** A companion in the party leaves it when their trust is **-30 or lower** (the conflict line) and their fear is **under 60** (the compliance line, CHARACTERS). Fear 60+ keeps a companion who no longer trusts you, until the fade at a chapter change lets them go (§4: stay out of fear, leave when it fades). Checked after every effect list and at a chapter change. **Recruiting (D31):** `['party','+id']` is refused with an ERROR when that companion would walk out at once (same test: trust -30 or lower, fear under 60), so a join never ends in a silent join-and-leave; `lint:story` warns about it, and also about a join followed by a trust drop in the same list (that one is allowed, and the walk-out is logged). **The dead do not change (D31):** `trust` and `fear` effects on a dead npc are logged and ignored, and the chapter's fear fade skips them. Honor-negative plus fear is the "Warden of the Dead" route.

## 7. Player-facing UI

- Center-split meter: red left (infamy), gold right (respect), marker at current value.
- Tier name under the meter. Toasts: `Honor +5 (Mercy)` or `Honor -3 (Lie, unseen)`.
- Journal tab "Deeds" (live since M3 s2, D30): the last 20 deeds, newest first, each with its tag, Seen / Unseen / Came out (a hidden deed whose secret surfaced), the honor it moved, the day, and who reacted (companion and trust change). The list is `GameState.deeds` (`engine/deeds.ts`); `journalOf` reads it. The honor shown is after the per-scene cap (D31): when a scene hits ±25, the newest deeds of that scene that moved honor the same way give back the excess (a deed can drop to "No change", never flip sign; deeds from earlier scenes are not touched), so the list adds up to what the meter did. A revealed secret that owed honor but hid no deeds on record (a v1 save) adds one deed tagged `unknown` that carries the honor paid (D32).
- Journal tab "People": cards (`CharacterCard`) with trust and fear meters, with-you / dead chips and the perk line; the party first. A person is listed once you have met them (D31: a scene named them in `who` or one of their `say` beats showed, or a `trust` / `fear` / `party` effect touched them: `GameState.met`), travel with you, are dead, or their trust or fear has moved from the start (the last rule covers v3 saves; a fear that only faded does not count).

## 8. Implementation notes

- Pure functions in `engine/honor.ts` (live since M1 s2): `applyDeed(state, tag, witnessed, scale, deeds) -> {state, log, owed?, deed?}` (`deed` = tag, witnessed, repeat factor, for the reactions), `capScene(before, state, prior?)` (trims the scene's deeds with `deeds.trimDeeds`, D31), `surface(state, id)`. Reactions and the walk-out are in `engine/relations.ts` (`react`, `walkouts`); every deed is recorded by `effects.apply` into `GameState.deeds` (`engine/deeds.ts`, D30), driven by `effects.apply` / `applyAll` with the story's `Social` table (D14). The deed table is `src/story/honor.ts` (`DEEDS`), passed in by the caller. Unknown tag = ERROR log, no change.
- Tier is derived (`tierOf(honor)`), never stored.
- Unit tests (`tests/engine/honor.test.ts`, `effects.test.ts`): witness halving (half + remainder always equals the full delta), diminishing returns, scene cap, clamp, secret surfacing.
- Story linter: warns if an unknown tag is used, or a chapter has no tag diversity.