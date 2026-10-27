# STORYLINE (the story as it is now: a map you can read and add to)

One scene per box, top to bottom. `|` = the story goes on. A choice splits the line and the branches join again.
**Owner notes:** add your own lines anywhere and end each with `-joshua`. The AI must **keep every `-joshua` line word for word**, treat it as your wish for the story (follow it, or say in HANDOFF why it cannot be done), and move it into the right place when it writes that scene. When the story changes, the AI updates this file in the same session (START_HERE Rule 0).
**Status tags:** `LIVE` = in the game now, `STAND-IN` = the test chapter, deleted in M4, `PLANNED` = in STORYBOARD only, not written.

```
PROLOGUE "Fever Dreams" (Day 1)                                        LIVE
|
PART 1: the intro (23 scenes, about 6 minutes)                         LIVE
|
p.dream      cold open: a bell under water, a knock, your name
|
p.wake       the fever breaks into a wrong silence (6:12)
|
p.phone      eleven missed calls (a line for each background)
|
p.tv         a muted anchor, mouth open on half a word
|
p.below      the street is empty but for a woman in a bathrobe       Reason -2
|
p.building   small noises, a couple arguing about leaving            Reason -3
|
p.whine      a dog whines behind the stairwell door
|
p.stairs     CHOICE: Biscuit hangs from his leash
|--- a Whisper him calm (Heart 7) ---- pass: Biscuit joins, trust +15, Reason +5
|                                       fail: Biscuit joins, trust +10, HP -1, flag stairs_noise
|--- b Haul him loose (Grit 7) ------- same two outcomes
|--- c Shut the door ------------------ flag biscuit_left, Reason -5
|
p.landing    aftermath (a line for each way it went)
|
p.bowl       water for Biscuit (if he came) / pantry line             time: day
|
p.knock      the dream's knock, three slow and three more
|
p.dole       CHOICE: Dole, bitten, burning up
|--- a Let him in ------------- honor mercy, flag dole_inside, ECHO p.dole_knocks in 2 scenes
|       |
|       p.dole_in
|--- b Keep the bolt on -------- honor abandon, flag dole_out
|       |
|       p.dole_out
|--- c Send him to St. Brigid's - honor honest, flag dole_sent, Reason -3
|       |
|       p.dole_sent
|
p.hours      the afternoon goes sideways                              time: dusk
|
p.dole_knocks  (ECHO, only if Dole is inside) knocking from the bathroom   Reason -10
|
p.dusk       the power dies, red lamps on the cranes
|
p.bell       a church bell, a street of people walking toward it      Reason -5, time: night
|
p.static     the crank radio, wrapped in a towel
|
p.voice      Juno breaks in over the loop: "I don't have a word for them"
|
p.radio      CHOICE: the Haven loop (Pier 9, Day 21)
|--- a Believe it ------- flags heard_haven + haven_trust, Reason +5
|--- b Doubt it --------- flags heard_haven + haven_doubt, Reason +3
|--- c Switch it off ---- flags heard_haven + radio_off, Reason +2
|
p.night      you fall asleep on it (lines for each of the three)
|
PART 2                                                                 PLANNED (M4)
|
p.street     a father and a child ask for food: share / refuse / rob  (ECHO: he comes back in Ch4)
|
p.gate       you leave the building, Day 2 dawn
|
CH1 "Quarantine Zone" (Days 1-3, about 22 scenes)                      PLANNED (M4)
|
c1.route  >  c1.hospital  >  c1.nora  >  ...   (see STORYBOARD section 3)
```

```
TEST CHAPTER (it stands in for Part 2 and Ch1 until M4)                STAND-IN
|
t.wake       Nora at the door                                         flag test_started
|--- a Let her in, share food ---- honor share, Nora joins, trust +10, Food -1
|--- b Take her pack, bar the door - honor steal (unwitnessed), secret stolen_meds, Meds +2
|--- c Shoulder through the barricade - Grit 5: Reason +5, or HP -1
|
t.street     CHOICE: a bus across the road, a big man (Brick)
|--- a Level your gun ------ honor intimidate, Brick fear +15, Brick joins, ECHO t.echo (needs Reason 20, Ammo -1)
|--- b Confess the theft --- reveal stolen_meds, honor honest, Nora trust -5 (only if you hold the secret)
|--- c Send Nora back up --- Nora leaves, honor abandon, Nora trust -20 (only if she is with you)
|--- d Slip past the bus --- time: night, ECHO t.echo
|
t.echo       (ECHO) a gray figure knocks on a lamppost                Reason -5
|
t.gate       CHOICE: the loudspeaker, six seats (a gate scene: the chapter checkpoint)
|--- a Rally the crowd ------- flag final_lead, Brick trust +10
|--- b Hold the pier --------- flags final_stay + broadcast_changed
|--- c Leave them all -------- honor abandon, Nora dies, trait Hardened, flags route_fear + nora_turned
|--- d Charge the horde ------ honor sacrifice, HP -5
|
t.end        a ship horn; the ending is picked by your honor, party and flags
```

## Endings now in the game

`lighthouse`, `death`, `rot_within`, `last_seat` are reached by the fuzz bot; `beacon`, `warden_of_the_dead`, `broken_reason` are not reached yet (they need M4 to M6 content).

## Your notes (add lines here, each ending with `-joshua`)

- _(nothing yet)_
