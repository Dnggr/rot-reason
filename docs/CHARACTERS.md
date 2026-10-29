# CHARACTERS

IDs are lowercase and used everywhere in data (`nora`, `brick`...). Starting `trust` / `fear` are shown as T/F.
Fields per character: **Trait** (how they act), **Perk** (party benefit), **Flaw**, **Secret**, **Wants/Fears**, **Likes/Dislikes** (honor tags), **Arc by chapter**, **Honor reaction**, **Fates**.

## Protagonist (player)
- **Name:** player-chosen (default "Ash"). Pronouns neutral in text unless chosen later.
- **Backgrounds** (pick one; sets Attributes, trait, starting kit):

| Background | Grit | Wits | Heart | Trait | Kit | Unique hook |
|---|---|---|---|---|---|---|
| Dockworker | 4 | 2 | 3 | Hauler | 1 Food, crowbar | Knows Pier 9; Ch4 service-gate shortcut |
| Mechanic | 3 | 4 | 2 | Fixer | 1 Ammo, toolkit | Repairs radio, gates, vehicles; Ch3 vehicle option |
| Teacher | 2 | 3 | 4 | Silver Tongue | 2 Meds | Persuasion checks easier; kids and elders trust faster |

In data (`src/story/backgrounds.ts`) the hook is an optional one-line `hook` string written for the player and shown on the Background screen; it promises no mechanic that is not in `traits.ts`.

- **Voice:** second person narration, present tense, short sentences.
- **Hidden arc:** the story asks whether you are becoming the person you'd have feared on Day 1.

## Nora Vance, ER nurse (the conscience)
- **Age/Look:** 34, scrubs under a stolen parka, tired steady eyes.
- **Trait:** Compassionate, practical, hides pain. **Perk:** Medic (+1 effect from Meds, can stabilize a wound).
- **Flaw:** self-sacrificing to the point of lying. **Secret:** bitten in Ch2 and conceals it.
- **Wants:** to save everyone she can. **Fears:** being a danger to people she loves.
- **Likes:** mercy, protect, share, honest. **Dislikes:** kill_surrender, abandon, intimidate.
- **T/F:** 10 / 0.
- **Arc:** Ch1 joins (or refuses if you looted the ward) · Ch2 bitten shielding a child/Biscuit · Ch3 bite revealed, serum dilemma · Ch4 screening threatens her · Ch5 final choice about Haven.
- **Honor reaction:** low honor: stays out of duty, flinches, may leave. High: opens up, reveals bite earlier.
- **Fates:** serum-slowed and boards · mercy-killed · left at pier · turns · carrier ending.

## Dominic "Brick" Salazar, ex-con dockhand (the shield)
- **Age/Look:** 41, huge, soft-spoken, prison tattoos, reads paperbacks.
- **Trait:** Loyal, blunt, short temper when disrespected. **Perk:** Bruiser (Grit checks +2 when present; holds a door in Ch5). *Live (M3 s2, D30): `PERKS.brick` gives the Bruiser bonus while he is alive and in the party.*
- **Flaw:** violence as first answer. **Secret:** went to prison taking the fall for his brother, who is now a Reaper.
- **Wants:** to be treated as a man, not a record. **Fears:** being caged again.
- **Likes:** protect, share, keep_word, intimidate (if aimed at bullies). **Dislikes:** abandon, betray, lie (to him).
- **T/F:** 0 / 5.
- **Arc:** Ch2 locked in church basement for stealing food (free him, trade for him, leave him) · Ch3 recognizes Silas's crew; his brother is there · Ch4 deals with loyalty to you vs family · Ch5 holds the gate.
- **Honor reaction:** low honor: respects strength, loyal if feared AND fed. High: loyal like family.
- **Fates:** holds the gate and survives · dies holding gate · defects to brother · stays on the pier.

## Juno Park, teen radio scavenger (the truth)
- **Age/Look:** 16, oversized headphones, soldering burns, sarcastic.
- **Trait:** Clever, reckless, honest to a fault. **Perk:** Signal (+1 Wits checks involving tech; intercepts broadcasts, reveals ambushes). *Live (M3 s2, D30): `PERKS.juno` gives +1 on every Wits check while she is in the party; "involving tech" is not modelled.*
- **Flaw:** cannot stay out of danger when curious. **Secret:** knows the "Haven" broadcast loops and may be pre-recorded.
- **Wants:** to find her older brother (on the pier). **Fears:** being alone in the dark.
- **Likes:** honest, protect, share. **Dislikes:** lie (strongly), abandon, steal.
- **T/F:** 5 / 0.
- **Arc:** Prologue first heard (`p.voice`): breaks into the Haven loop, says nobody has a word for them, notices Haven named "the Rot" before the city had a problem · Ch1 radio voice only, met in person late Ch1/Ch2 · Ch2 argues with Hart · Ch3 deciphers depot logs · Ch4 finds her brother (alive or listed as dead) · Ch5 broadcast choice that shapes the final crowd.
- **Honor reaction:** low honor: scared of you, goes quiet, may sabotage. High: idolizes you, takes risks for you.
- **Fates:** boards · stays to broadcast · sacrificed in a bad run · leaves alone if betrayed.

## Pastor Elias Hart, congregation leader (control vs faith)
- **Age/Look:** 58, clerical collar over a flak vest, warm voice.
- **Trait:** Charismatic, rule-bound, rations by "worthiness". **Perk:** Shelter (Ch2 safe camp; later can bring followers to Ch5).
- **Flaw:** certainty. **Secret:** keeps his turned wife alive in the crypt and diverts food to hide it.
- **Wants:** to keep his flock together and his wife safe. **Fears:** being proven a fraud.
- **Likes:** sacrifice, share, faith/obedience. **Dislikes:** steal, lie, intimidate.
- **T/F:** 0 / 0.
- **Arc:** Ch2 antagonist/ally · crypt choice · Ch3 absent (echo only) · Ch4 flock arrives at the pier or doesn't · Ch5 stands with you, against you, or is gone.
- **Honor reaction:** low honor: treats you as a threat; high: names you "the Shepherd's hand" and trusts you with his secret.
- **Fates:** exposed and exiled · mercy: wife released, he follows you · remains in power · dies protecting the flock.

## Sgt. Ray Calloway, deserter (the pragmatist)
- **Age/Look:** 47, immaculate boots, torn fatigues, sharp humor.
- **Trait:** Tactical, paranoid, speaks in probabilities. **Perk:** Armory (Ammo +2 once per chapter; unlocks depot).
- **Flaw:** treats people as variables. **Secret:** helped design the Haven screening protocol, then deserted when he saw what it does.
- **Wants:** redemption without admitting guilt. **Fears:** being recognized.
- **Likes:** lie (as tactic), steal (from raiders), abandon (if strategic), pragmatism. **Dislikes:** mercy when it endangers the mission, honest-to-a-fault.
- **T/F:** -5 / 5.
- **Arc:** Ch1 checkpoint cameo and deal · Ch3 depot: trades ammo and the serum for info · Ch4 reveals what screening means · Ch5 tells the truth about Haven; chooses to board, stay, or take the blame.
- **Honor reaction:** low honor: respects your results, offers cold alliance; high: distrusts "heroes" but quietly follows.
- **Fates:** boards · stays behind to destroy the screening list · killed by Reapers · betrays you if trust < -30.

## Warden Vera Kline, Pier 9 commander (order by fear)
- **Age/Look:** 52, ex-harbor police, silver braid, never raises her voice.
- **Trait:** Controlled, fair on paper, transactional. **Perk:** none (antagonist/gatekeeper).
- **Flaw:** has convinced herself that cruelty is bookkeeping. **Secret:** sells seats; the manifest is half bribes.
- **Wants:** to keep the pier alive until the ship. **Fears:** disorder, and being replaced by someone crueler.
- **Likes (as faction):** respect for authority, keep_word. **Dislikes:** intimidate toward her people, steal.
- **T/F:** 0 / 10.
- **Arc:** Ch4 gatekeeper, three seat routes · Ch5 can be allied, deposed, or exposed.
- **Honor reaction:** low honor: tries to buy or break you; high: uneasy respect, grants audience.
- **Fates:** exposed and deposed · allied · killed in the siege · flees by boat.

## Silas Crane, Reapers leader (the mirror)
- **Age/Look:** 36, ex-paramedic with a ringmaster coat, grinning.
- **Trait:** Charming, theatrical, ruthlessly honest about being a predator. **Perk:** none (antagonist/offer-maker).
- **Flaw:** needs an audience. **Secret:** was a hero on Day 3 and failed to save someone; now says nobody is worth saving.
- **Wants:** to prove the world is as ugly as he says. **Fears:** being proven wrong by you.
- **Likes (as faction):** intimidate, steal, cruelty_show. **Dislikes:** mercy as a performance.
- **T/F:** 0 / 0.
- **Arc:** Ch3 ambush/parley · Ch4 offers a deal to betray Vera · Ch5 leads siege or stands down.
- **Honor reaction:** low honor: courts you ("We could use a closer."); high: obsessed with corrupting you.
- **Fates:** killed · recruited · defeated and spared · escapes.

## Walt Dole, the neighbor in 3B (the first cost)
- **Role:** Prologue only (`dole`, not a companion, no trust or fear effects). Late 60s, cardigan, slippers, plays ballgames too loud, a late wife, a bad-hipped dog (Biscuit is his).
- **Beat:** bitten on the stairs by a man in a St. Brigid's wristband; knocks (three slow, a wait, three more) and asks to sit down. The player lets him in (he is shut in the bathroom and knocks from inside: echo), keeps him out (he stops talking; later the knock comes back with no voice), or sends him to St. Brigid's (he is seen again in the street, far from it).
- **Rule:** he never says what is wrong with him; nobody can.

## Biscuit, a scruffy mutt (the heart)
- **Trait:** loyal, alert. **Perk:** Reason +1 at camp; alerts to ambushes (once per chapter).
- **Likes:** share, protect. **Dislikes:** nothing; reacts to cruelty by hiding.
- **Origin:** Dole's dog, found hanging from his leash in the stairwell (Prologue, `p.stairs`); the tag reads DOLE, 3B and, on the back, BISCUIT. He hides from Dole once Dole is bitten. If the player shuts the door (`biscuit_left`) he is simply left behind, not killed.
- **Fates:** survives with you · lost in a bad run · sacrificed (high-impact Reason hit). **Rule:** the game never forces Biscuit's death on a neutral choice. Only the player can cause it.

## Cast matrix: who leaves you
| Companion | Leaves if | Betrays if | Stays at ending if |
|---|---|---|---|
| Nora | you kill a surrendered person or abandon the wounded 2+ times | she is left behind alone | trust ≥ 40 and she's alive |
| Brick | you break a promise to him, or his brother's fate is cruel | trust < -20 and fear < 20 | trust ≥ 30 |
| Juno | you lie to her twice | trust < -30 (sabotage) | trust ≥ 30 |
| Hart | you exposed his secret publicly | trust < -40 | trust ≥ 40 |
| Calloway | trust < -10 and Haven truth is revealed | trust < -30 | pragmatic path (survives, no bond needed) |

## Relationship thresholds (global)
`trust ≥ 30` unlocks a **bond scene** at camp (gives a perk upgrade and a backstory reveal). `trust ≤ -30` unlocks a **conflict scene**; until those scenes exist (M5), a companion at that line **walks out of the party** unless fear holds them (engine, M3 s1: `story/approval.ts` `SOCIAL`). `fear ≥ 60` unlocks "compliance" lines but no bond scene, and keeps a distrustful companion with you.

## Perks in the engine (M3 s2, D30)
A perk is listed in `src/story/traits.ts` `PERKS` (companion id -> `{ trait, text }`) only when the engine applies it. `heldTraits(state, perks)` adds the perk trait of every living companion in the party to the player's own traits for every check and every odds word, so there is no `['trait', '+Bruiser']` effect to forget: leaving, death and a walk-out all end the perk. The card line in the Journal is `text`. Add a row when a mechanic exists (Medic, Shelter, Armory, Biscuit).