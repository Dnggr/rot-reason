# GAME DESIGN

## 1. Pillars (every feature must serve at least one)

1. **Choices cost something.** No free options, no obviously right answer.
2. **You are what you did.** Honor and relationships remember, and the world reacts visibly.
3. **People over zombies.** The dead are the setting; the drama is the living.
4. **Fast to play, deep to replay.** 30 s per scene, ~30 min per run, 6 endings, 3 backgrounds.
5. **Story first (85:15).** It plays like a told story with a few heavy decisions, not like a game with a story attached. About 85% of what the player does is reading and continuing, 15% is choosing (D22). Nobody in the world has a word for the dead, so the player discovers the rules by watching (D23).

## 2. Player fantasy, tone, guardrails

- **Fantasy:** "I decided who got to live, and I have to live with who I became."
- **Tone:** grounded, bleak but not hopeless; small moments of warmth and dark humor. Show through concrete detail, not exposition.
- **Guardrails:** violence is implied or brief, never gratuitous. No real-world groups as villains. No sexual violence. No content that targets children (kids appear as stakes, never as gore). Optional "Soften violence" setting (replaces graphic lines with short variants).

## 3. Core loop

```
Scene (read) -> Choice (cost) -> Consequence (instant + echo later) -> Camp (recover / bond) -> next Scene
```

- **Micro (30 s):** read 40-90 words, then usually tap Continue; about one scene in seven asks for a choice (2-4 options, then a toast like "Nora will remember that").
- **Meso (5 min):** a scene chain ends in a bottleneck scene (all branches converge).
- **Macro (30 min):** 5 chapters + prologue, Day 1 to Day 21, ending resolved from honor, alive party, flags.

## 4. Systems (MVP = M1-M4, Later = M5+)

| System | Range | Role | When |
|---|---|---|---|
| HP | 0-5 | 0 = death ending (`sys.death`, beats any ending). Lost to danger, restored by meds/rest | MVP |
| Reason | 0-100 | Sanity. Falls with horror, killing humans, losing allies. Rises with rest, bonds, Biscuit. Low = unreliable text, forced options | MVP |
| Food / Ammo / Meds | 0-9 each | Spent by choices, camp, checks. Scarcity drives dilemmas | MVP |
| Honor | -100..+100 | Reputation. See `HONOR.md` | MVP |
| Trust / Fear per NPC | -100..100 / 0..100 | How each person feels about you | MVP |
| Attributes | Grit, Wits, Heart (1-5) | Used in checks; set by background | MVP |
| Traits | tags | Unlock options (e.g. Medic, Silver Tongue, Haunted) | MVP |
| Rot | 0-100 | Infection of a bitten character (Nora, optionally you). Ticking clock | Later (M5) |
| Day / Phase | 1-21 / Dawn-Day-Dusk-Night | Night raises danger; Day 21 = ship leaves | MVP |
| Echoes | queue | Delayed consequences | MVP |
| Secrets | set | Unwitnessed deeds that can surface later | M3 |

**Checks (no combat system).** `roll = d6 (seeded) + attribute + trait bonus` vs `DC`. A tie passes (`total >= DC`). Trait bonuses live in `src/story/traits.ts` (Bruiser: Grit +2, Signal: Wits +1); `resolveCheck` adds the bonus of every trait the player holds. `select.currentView` gives each check choice an odds word: Risky (2 or fewer of 6 faces win), Even (3), Likely (4 or more); the UI never hides the cost of failure. Violence is resolved by choice plus check, not a combat screen.

**Time.** Scenes may advance the clock. Camp costs 1 Food per living party member (+ Biscuit). Running out of food costs HP/Reason, never an instant fail.

**Camp hub (safe scenes).** Eat, rest (+Reason), talk to a companion (bond scene if trust threshold met), plan the route. Camp scenes are templates fed by data, not hand-written each time.

**Party.** Max 3 companions at once (enforced in `engine/effects.ts`). Each has a perk, an opinion of your tags, and a leave/betray threshold.

**Echoes.** A choice can schedule a future scene (`after N scenes` or `at chapter X`). This is the main consequence engine.

**Secrets.** An unwitnessed deed is stored as a secret; it can surface later (a witness, a diary, a confession) and then applies its full honor and trust cost.

## 5. Choice design rules (writers and Claude must follow)

1. 2-4 choices (Hick's law). Each ≤ 12 words.
2. Differ in **value**, not wording. Each option implies a different priority (safety, kindness, power, truth, speed).
3. Every dilemma has a cost on each side (resource, trust, honor, time, Reason).
4. Show tradeoffs before the click: tone tag ([Mercy], [Lie], [Threaten]), cost chips (-2 Food), locked options with the reason shown.
5. Reflect the choice **in the next scene** (a callback line) and **later** (an echo).
6. At most 1 hard fail path per chapter; death is a consequence, not a punishment for exploring.
7. Always leave a way forward: no soft-locks (enforced by fuzz test).

## 6. Techniques used (and where)

| Technique | How we apply it |
|---|---|
| **Branch and bottleneck** | Paths diverge inside a chapter and converge at a gate scene. Variables, not new maps, carry the difference. Keeps content finite |
| **Delayed consequences (echoes)** | Prologue choices pay off in Ch4-5 |
| **Witness system** | Deeds only count fully if seen (from Red Dead). Creates secrets and exposure drama |
| **"X will remember that" toast** | Telltale-style feedback, tells the player the game noticed |
| **Moral dilemma triangle** | Seat routes: Respect / Fear / Cunning, each viable, each costly |
| **Ticking clock** | Day 21 ship; Nora's Rot; food |
| **Chekhov's gun registry** | Every planted flag must be used later; linter warns on set-never-read |
| **Unreliable narrator** | Low Reason changes text and hides/forces options |
| **Hub and spoke** | Camp scenes between story spikes |
| **Three acts + beat sheet** | Act I (Prologue-Ch1), Act II (Ch2-4), Act III (Ch5). Midpoint twist at Ch3, All-is-lost at Ch4 screening |
| **Dramatic irony** | Calloway hints at the truth about Haven before the player understands it |
| **Character foils** | Hart (faith, control) vs Juno (truth, chaos); Vera (order by fear) vs player at high honor |
| **Rule of three** | Three routes, three backgrounds, three honor outlooks per scene where possible |
| **Pacing curve** | Alternate high and low tension; see tension targets in STORYBOARD |
| **MDA lens** | Mechanics (choice, honor, resources) -> Dynamics (hard tradeoffs) -> Aesthetics (dread, guilt, belonging) |
| **Vertical slice first** | Ship Prologue + Ch1 fully polished before writing Ch2 |
| **MoSCoW scope** | Must / Should / Could list below |
| **Fuzz and golden paths** | Bots find soft-locks; scripted runs guard main routes |
| **Progressive disclosure (UI)** | Show only what the scene needs; details in Journal |
| **Thumb-zone layout** | Choices at the bottom, reachable one-handed |

## 7. Scope (MoSCoW)

- **Must:** engine, 6 chapters of text, honor, 6 endings, 3 backgrounds, autosave, Journal, debug tools.
- **Should:** Rot/Reason mechanics, camp hub, companion bond scenes, SFX, soften-violence setting.
- **Could:** timed choices, ambient music, share-your-ending card, PWA install.
- **Won't (v1):** real-time combat, inventory crafting, multiplayer, account system, backend.

## 8. Content budget

~130 scenes total (Prologue 8, Ch1-5 about 22 each, 12 camp/ending). ~60 words per scene, ~7.5k words of story. Each chapter ≤ 400 lines per file, split into `a/b` files if larger.
