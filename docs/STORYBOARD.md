# STORYBOARD (main line, flexible)

**Premise:** Day 1, "the Rot" hits Marrow Bay (port city, 400k people). A looping radio broadcast promises **Haven**: "Pier 9, Day 21, limited manifest." There are **six seats**.
**Central question:** Who gets a seat, and who do you become to get one?
**Theme:** Reason vs instinct. Mercy vs survival. Order bought with fear vs trust earned with cost.
**Rule:** this is the spine. Scene IDs, flags and endings may change, but update this file in the same session.

## 1. Structure
| Act | Chapters | Days | Tension (1-10) | Job |
|---|---|---|---|---|
| I | Prologue, Ch1 | 1-3 | 4, 6 | Teach rules, establish honor, assemble the first party |
| II-A | Ch2 | 4-7 | 7 | Moral pressure: the Church; first betrayal of trust |
| II-B | Ch3 | 8-12 | 8 | **Midpoint twist:** the bite and the serum; armory and Reapers |
| II-C | Ch4 | 13-18 | 9 | **All-is-lost:** seat politics and the Screening |
| III | Ch5 | 19-21 | 10 | Siege, boarding, the truth about Haven, ending |

```mermaid
flowchart LR
 P[Prologue D1] --> C1[Ch1 Quarantine D1-3]
 C1 -->|route=church| C2[Ch2 Mercy Street D4-7]
 C1 -->|route=highway| HW[Highway detour] --> C2
 C2 --> C3[Ch3 The Bite D8-12]
 C3 --> C4[Ch4 Pier 9 D13-18]
 C4 --> C5[Ch5 The Last Tide D19-21]
 C5 --> E{Ending resolver}
```
Every chapter ends on a **gate scene** (bottleneck) that reads variables, not path.

## 2. Canon facts (do not contradict)
- The Rot spreads by bite; fever 6-30 hours; "turning" takes minutes after death. Dead hunt by sound.
- Bells, engines, and screaming draw hordes. Quiet is survival.
- Haven is real and offshore. The broadcast loops from a relay on a lighthouse near Pier 9.
- Seats are checked at the **Screening** (a test for infection). Carriers are refused, and what happens to them is Calloway's secret.
- Ship departs **Day 21 at dusk**.

## 3. Chapters

### Prologue: "Fever Dreams" (Day 1, 8 scenes)
Goal: pick background, learn choices/checks, set first honor, meet Biscuit and the radio voice.
| Scene | Beat | Key choice | Consequence / Echo |
|---|---|---|---|
| p.wake | Name + background; apartment, muted TV, sirens | Choose background | Attributes, kit |
| p.dole | Neighbor Dole, bitten, begs for help | Mercy-kill / lock out / bring inside | `mercy` or `abandon`; if inside, **echo:** he turns in Ch1 night (Reason -10) |
| p.biscuit | Dog trapped in stairwell | Risk HP / leave | Biscuit joins (Reason regen) or lost |
| p.radio | Juno's voice: "Haven, Pier 9" | Trust it / doubt it | Flag `heard_haven`; sets early Reason tone |
| p.street | A father and child ask for food | Share / refuse / rob | `share` / none / `steal`. Witnessed. **Echo:** father reappears in Ch4 as ally or enemy |
| p.gate | Gate scene: exit the building | n/a | Day 1 dusk |

### Ch1: "Quarantine Zone" (Days 1-3, ~22 scenes)
Goal: find allies and supplies; first camp; choose route.
| Scene | Beat | Key choice | Consequence / Echo |
|---|---|---|---|
| c1.route | Streets blocked | Alley (Grit) / Rooftops (Wits) / Sewer (Heart: calm the rats?) | Resource and HP variance; flavor callbacks |
| c1.hospital | St. Brigid's ER overrun; Nora triages | Help patients (-Meds) / take Meds and go / lock the ward | `protect`/`steal`/`abandon`. **Echo:** survivors vouch (or accuse) you at Pier 9 |
| c1.nora | Recruit Nora | Convince / accept / refuse | Party +Nora (trust set by deeds) |
| c1.checkpoint | Calloway's deserter camp at a checkpoint | Trade info for ammo (lie or truth) / ignore | Seeds Calloway; `lie` or `honest` |
| c1.camp | First camp; bond with Biscuit/Nora; Dole echo if brought inside | Eat / rest / talk | Reason, trust, food |
| c1.gate | Two ways to Pier 9: **Church** (Mercy St, safe but strict) or **Highway** (fast, deadly) | Route choice | Flag `route`. Highway gives a detour scene, then merges into Ch2 |

### Ch2: "Mercy Street" (Days 4-7, ~22 scenes)
Goal: the Congregation shelter; control vs conscience.
| Scene | Beat | Key choice | Consequence / Echo |
|---|---|---|---|
| c2.rules | Hart's rules: work for food | Accept / negotiate (Heart) / sneak | Trust with Hart |
| c2.list | The Ration List ranks people by "worthiness" | Comply / sabotage / confront | Congregation standing; `honest`/`lie` |
| c2.brick | Brick locked in basement for stealing | Free him / trade labor for him / leave | Brick loyalty or resentment. If freed while witnessed, Hart hostile |
| c2.juno | Juno found in bell tower with a radio | Befriend / use / confront | Party +Juno (conditions) |
| c2.crypt | **Secret:** Hart keeps his turned wife alive | Expose publicly / mercy-kill her / keep the secret | Large honor swing. **Echo (secret):** Hart appears in Ch4/5 as ally, enemy, or blackmailer |
| c2.toll | Night: the bell is rung, a horde comes | Ring to lure them away (lose some congregants) / barricade / flee | `sacrifice` or `abandon`. **Nora is bitten** (how: shielding a child, Biscuit, or you) |
| c2.gate | Leave the church (as hero, exile, or arsonist) | n/a | Flags: `church_fate`, `hart_fate` |

### Ch3: "The Bite" (Days 8-12, ~22 scenes)
Goal: armory depot, the serum, Reapers. Midpoint twist: Nora's infection and the single dose.
| Scene | Beat | Key choice | Consequence / Echo |
|---|---|---|---|
| c3.signs | Nora's fever, sweating, hidden bandage | Confront privately / publicly / ignore | `honest`/`betray`; Nora trust swing |
| c3.depot | Armory depot; Calloway runs it | Barter (info/ammo) / steal / threaten | Ammo, Calloway trust |
| c3.reapers | Silas Crane's ambush | Parley (honor-gated) / fight (Grit) / sneak (Wits) | **Low honor:** Silas offers a partnership. **High honor:** Silas mocks you but respects the party. Brick recognizes his brother |
| c3.serum | **One dose** of the slowing serum found | Give to Nora / keep for self / trade to Calloway / destroy | Huge `sacrifice`/`steal`/`betray` branch; sets `rot_rate` |
| c3.fate | Nora's path | Keep her in the party hidden / quarantine her / send her away / mercy-kill | Defines Ch4 Screening risk |
| c3.gate | Road to the pier opens | n/a | Flags: `nora_status`, `serum_used`, `silas_deal` |

### Ch4: "Pier 9" (Days 13-18, ~22 scenes)
Goal: get a seat. Three routes, each costly. Warden Vera Kline controls the manifest.
| Route | How | Cost |
|---|---|---|
| **Respect** | Earn deeds with dock families; get witnesses to vouch (needs honor ≥ 21) | Time; share resources; refuse shortcuts |
| **Fear** | Back Silas or intimidate Vera's guards (honor ≤ -21) | Trust of companions; Reapers owe you |
| **Cunning** | Forge manifest via Juno / Dockworker shortcut / blackmail with Hart's secret | Risk of exposure; Wits checks |

| Scene | Beat | Key choice | Consequence / Echo |
|---|---|---|---|
| c4.line | The queue and Vera's "tax" | Pay / refuse / bribe | Resources, Vera fear/trust |
| c4.father | Prologue father returns | Help / ignore / use | Echo payoff from p.street |
| c4.families | Dock families side quest | Help / skip | `protect`; allies for Ch5 |
| c4.silas | Silas offers: sabotage Vera, get a seat | Accept / refuse / double-cross | Fear route; Brick conflict |
| c4.brother | Juno finds her brother | Reunite / lie / tell truth | Juno trust |
| c4.screen | **The Screening** (all-is-lost) | Hide Nora / reveal / sacrifice yourself / expose Vera | Nora, Vera, seat count |
| c4.gate | Manifest is set | n/a | Flags: `seats`, `route_used` |

### Ch5: "The Last Tide" (Days 19-21, ~22 scenes)
Goal: siege, boarding, the truth, the final choice.
| Scene | Beat | Key choice | Consequence / Echo |
|---|---|---|---|
| c5.siege | Reapers hit the gates | Defend gate / flood the lower deck / negotiate | Who holds the line depends on alive companions + trust |
| c5.hold | Companion roles: Brick holds the door, Juno broadcasts, Calloway blows the bridge, Hart's flock rallies | Assign roles | Each role has a success/fail by trust |
| c5.board | Manifest boarding; names called | Who sits: you decide | Final party size, honor swing |
| c5.truth | Calloway tells the truth about Haven: screening is selection, carriers are taken for study (cure or disposal, unclear) | Believe / confront / board anyway | Reason and ending gate |
| c5.final | Gangway choice: sail / stay and hold the pier / lead the crowd out | Final choice | Ending resolver |

## 4. Endings (first matching rule wins; evaluated top to bottom)
| # | Ending | Condition (sketch) | Feel |
|---|---|---|---|
| E1 | **Beacon** | honor ≥ 61, ≥ 3 allies alive with trust ≥ 30, choose "lead" | Hope; people follow you to a new shore |
| E2 | **Warden of the Dead** | honor ≤ -61, fear route used | You rule the pier; hollow, safe, alone |
| E3 | **Broken Reason** | Reason < 20 at final | Fragmented text; ambiguous reality |
| E4 | **Rot Within** | you or Nora turned/rot ≥ 100, board or stay | Haven's "treatment"; bittersweet |
| E5 | **Last Seat** | default sail path, moderate honor | Escape with 1-2; cost remembered |
| E6 | **The Lighthouse** (secret) | stay at pier with Biscuit + Juno alive + `broadcast_changed` | Quiet hope; you become the new signal |

Each ending has 1 screen of epilogue per surviving companion (data-driven from `fate` flags).

In data (`src/story/endings.ts`, live since M1 s3) the ids are `beacon`, `warden_of_the_dead`, `broken_reason`, `rot_within`, `lighthouse`, `last_seat`, and E6 sits before E5 so the unconditional default is last. Allies for Beacon are Nora, Brick, Juno, Hart, Calloway (alive, trust >= 30). The flags they read (`final_lead`, `final_stay`, `route_fear`, `nora_turned`, `broadcast_changed`) are in `story/flags.ts`. Death is a separate ending id, `death`.

## 5. Flexible-change protocol
1. Change this file first (new beat or ending).
2. Update `flags.ts` registry and any ending conditions.
3. Run `npm run lint:story` (checks every referenced scene/flag).
4. Note the change in `HANDOFF.md` ("Story changes").
