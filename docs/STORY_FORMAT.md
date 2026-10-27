# STORY FORMAT (the data contract)

Story is **TypeScript data** (typed, autocompleted, validated by Zod (`engine/schema.ts`, live since M1 s1) + linter). Engine reads it; engine never contains prose.
One file per chapter part, ≤ 400 lines. Files export `scenes: Scene[]` (a plain array; `npm run lint:story` validates it).

## 1. IDs

- Scenes: `<chapter>.<name>` e.g. `c2.crypt`. Chapter gate scene is always `<chapter>.gate`.
- Choices: unique inside the scene: `a`, `b`, `c`, `d`.
- Flags: `snake_case`, registered in `src/story/flags.ts` with a one-line meaning. Unregistered flag = lint error.
- Characters, items, factions: lowercase ids from their data files.

## 2. Scene

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | unique |
| `text` | yes | `string` or `Beat[]`. Beat = `string`, `{ if, text }` for a conditional line, or `{ say, text, if? }` for a line a character speaks (see below) |
| `who` | no | characters present in the scene, max 3 (checked by the linter; the stage draws a portrait only for the character speaking a `say` line) |
| `place` | no | background key (`"church_nave"`) |
| `mood` | no | `calm`, `tense`, `dread`, `warm`, `glitch` (drives UI style) |
| `on` | no | effects applied on entering the scene |
| `choices` | yes* | 1-4 choices. *Not for `next`/`end` scenes |
| `next` | no | auto-continue to a scene id (use for narration-only beats); echo scenes use `'$resume'` |
| `end` | no | ending id, final scene. `'auto'` asks the ending resolver (`story/endings.ts`, first match wins); `'death'` is `sys.death`'s |
| `time` | no | `{ day?, phase? }` clock change, applied when the player leaves the scene |
| `glitch` | no | text shown instead of `text` when Reason is under 30 |
| `tags` | no | `camp`, `gate`, `hub`, `echo` (used by tooling) |

### Spoken lines (`say`, D28)

A `say` beat is one line spoken by a character: `{ say: 'dole', text: '"I just need to sit down."' }`, optionally with `if`. `say` is a character id from `characters.ts` (unknown id = lint error; it need not be in `who`). `text` carries its own quotation marks.

- The Play stage reads a scene turn by turn: beats with no `say` (narration) go in the middle of the screen; a `say` beat shows in the bottom dock with that character's portrait, and stays in the middle text, under their name, once the player moves on. Neighbouring beats with the same speaker form one turn (a speaker's three paragraphs are one Continue).
- Write a mixed line as separate beats: `'"I understand," Dole says, in the voice of a man who does not. "You\'ve been sick too."'` becomes `{ say: 'dole', text: '"I understand."' }`, then the narration `'He says it in the voice of a man who does not.'`, then another `say` beat.
- Speakers who are not characters (a recording, a voice on the phone, "the foreman") stay ordinary narration beats.
- The choices show on the scene's last turn only, so end a choice scene on the beat the player answers, whether it is narration or speech.

## 3. Choice

| Field | Meaning |
|---|---|
| `text` | ≤ 12 words |
| `tone` | `mercy`, `lie`, `threaten`, `brave`, `quiet`, `honest`, `cold` (UI tag) |
| `if` | condition to **show** (otherwise hidden) |
| `lock` | condition to **enable**; if false, shown disabled (`why: 'lock'`; the UI words the reason from this condition in `ui/lockReason.ts`, D20: a trait, honor / stat / attr / res / day threshold, tier, trust, fear, party or alive lock gets specific text; a flag, secret, bg or all / any / not reads "Locked" so it never spoils) |
| `cost` | chips shown and charged: `{ food:1, ammo:2 }` |
| `fx` | effects on pick |
| `check` | `{ attr, dc, pass:{fx?,to}, fail:{fx?,to} }`, replaces `to` |
| `to` | next scene id |
| `echo` | schedule a future scene (see effects) |

## 4. Conditions (`if` / `lock`): small, closed vocabulary

Tuples, combinable with `{ all: [c, ...] }`, `{ any: [c, ...] }`, `{ not: c }` (lists are non-empty, nest freely). Operators: `>=` `<=` `>` `<` `==`. Tiers: `T1`-`T5`.

```
['flag','route_church']            ['honor','>=',21]            ['tier','>=','T4']
['res','food','>=',2]              ['stat','reason','<',30]      ['attr','wits','>=',3]
['trait','Medic']                  ['alive','nora']              ['party','brick']
['trust','nora','>=',30]           ['fear','vera','>=',40]       ['bg','dockworker']
['day','>=',10]                    ['secret','hart_wife']
```

Runtime notes (`engine/conditions.ts`): `secret` is true while the secret is held, not yet revealed. Unknown npc ids read as not alive, trust 0, fear 0. `tier` compares in order `T1` < ... < `T5`.

## 5. Effects (`fx`, `on`): closed vocabulary

```
['honor','mercy', true]            // tag, witnessed. Delta comes from honor table
['stat','hp',-1]                   ['res','food',-1]            ['set','route_church']  ['clear','x']
['trust','nora',10]                ['fear','brick',5]
['party','+juno'] ['party','-juno'] ['kill','nora']              ['trait','+Hardened']
['secret','hart_wife']             ['reveal','hart_wife']
['echo',{ scene:'c4.father', after:12 }]    // after N scenes, or { at:'c4' } at chapter start
['time',{ day:1, phase:'night' }]
```

Shape rules (enforced by `engine/schema.ts`): `party` and `trait` values start with `+` or `-`; `echo` needs exactly one of `after` / `at`; `honor` is `[tag, witnessed]`.
Runtime rules (`engine/effects.ts`, `applyAll` applies a list in order):

- Numbers are clamped (hp 0-5, reason/rot 0-100, res 0-9, trust -100..100, fear 0..100, day 1-21). `time` sets absolute values.
- `party` holds at most 3 and a joiner must be a known npc **who is alive** and **who would not walk out at once** (trust -30 or lower with fear under 60 is an ERROR, D31; `lint:story` warns when an effect list does this, in either order). `trust`, `fear`, `kill` on an unknown npc, an unknown deed tag or a missing `+`/`-` are ERROR log lines and change nothing. `trust` / `fear` on a dead npc is logged and ignored (D31). `trust`, `fear` and `party` also mark the npc as met (the Journal lists them); so does a scene's `who` and the speaker of a `say` beat. `stat`, `res`, `trust` and `fear` take whole numbers (a fraction is a schema error, so the state always passes its own schema).
- `echo` `after: N`: N scenes play normally, then the echo fires at the next transition. `at: 'c4'`: due while the chapter is `c4`.
- Unwitnessed deeds: put `['honor', tag, false]` before `['secret', id]` in the same list. The secret then owes the rest of the deed and pays it on `['reveal', id]`. A secret with no deed before it owes nothing. A remainder with no secret after it is forfeited and logged.
- **Companion approval (D29).** A *witnessed* `['honor', tag, true]` moves the trust of every companion in the party at that moment by `story/approval.ts` (HONOR §5; scaled by the same repeat factor as the honor). An unwitnessed deed moves nobody; the tag is kept with its secret, and `['reveal', id]` makes the companions in the party *then* react to it in full. So do not author a `trust` effect for what the table already does; author `trust` for relationship beats the table cannot know (a confession to the victim, a promise). Order matters: put `['party','+id']` after the deed if the new companion did not see it.
- **Walk-out (D29).** At the end of every effect list, and when a chapter starts, a companion in the party whose trust is -30 or lower and whose fear is under 60 leaves it (log line, no flag). Fear 60+ keeps them until it fades. Perks you gave them (a trait) are not removed: author the `['trait','-X']` where the story knows they left (open, ROADMAP M3 bug list).

Flow rules (`engine/choose.ts`, `flow.ts`, `reducer.ts`):

- Order for a pick: `tick` echoes, pay `cost`, roll the `check`, apply choice `fx` then the branch `fx`, schedule the choice `echo`, `capScene`, apply the departing scene's `time`, then move.
- `lock` and `cost` are enforced by the reducer too: a locked, hidden or unaffordable pick is ignored and logged.
- Moving: a due echo replaces the target (any scene except system ones, endings included); the echo scene ends with `next: '$resume'` (or choices whose `to` is `'$resume'`) and play continues at the remembered target. Echo scenes must be tagged `echo` and exit only through `$resume`.
- A scene's `on` effects run when it is entered, under their own honor cap. A chapter is the part of the scene id before the first `.`; on a change deed counts reset and every npc's fear fades by 5. An echo scene does not change the chapter.
- hp 0 sends the player to `sys.death` (it beats any ending). A missing target goes to `sys.missing`, a thrown error to `sys.error`; both log an ERROR.
- Checks roll a seeded d6 (`d6 + attr + trait bonus >= dc`). The view shows odds as `risky` (2 or fewer faces win), `even` (3), `likely` (4 or more).

Adding a new effect or condition kind = edit `engine/effects.ts` or `conditions.ts` + `STORY_FORMAT.md` + a test, in one change.

## 6. Example (the contract, tiny)

```ts
{
  id: 'c2.crypt',
  mood: 'dread',
  who: ['hart'],
  text: ['The crypt door is warm. Something knocks, slow and patient.',
         { if: ['trust','nora','>=',20], text: 'Nora whispers: "Ash, don\'t."' }],
  choices: [
    { id:'a', tone:'honest', text:'Tell the congregation what is down here.',
      fx:[['honor','honest',true],['trust','hart',-40],['reveal','hart_wife']], to:'c2.toll' },
    { id:'b', tone:'mercy', text:'End her suffering, quietly.',
      fx:[['honor','mercy',false],['secret','hart_wife'],['trust','hart',-10]],
      echo:{ scene:'c4.hart_knows', after:14 }, to:'c2.toll' },
    { id:'c', tone:'quiet', text:'Walk away. You saw nothing.',
      fx:[['secret','hart_wife']], to:'c2.toll' },
  ],
}
```

## 7. Writing rules

**Voice:** second person, present tense, concrete nouns, no adverbs stacked, one image per sentence.
**Length:** a scene is 40-90 words; a beat ≤ 35 words. Mobile screens fit about 120 words with choices.
**Callbacks:** at least one conditional line per scene that reflects a past choice (`if` Beat).
**Honor lines:** where relevant, add NPC line variants for low and high honor tiers.
**No fake choices:** each choice must have different `fx`, `to`, or both.
**Consequence budget:** per chapter, ≥ 3 echoes planted and ≥ 3 echoes paid.
**Dead ends:** every `to` must exist; every scene must be reachable; every non-end scene must have an exit.
**Reason glitch:** scenes may include `glitch: string` variants shown when `reason < 30`.
**Story first (D22):** the target is 85:15 story to game. Most scenes are narration (`next`, a Continue tap); a scene that asks for a choice is the exception. Build suspense with sound, a wrong detail and a delay, not with a menu. Do not stack two choice scenes back to back.
**No word for it (D23):** in-world nobody knows "zombie" or "undead" (lint error). Characters say "the sick", "them", "that thing" until the Haven broadcast names "the Rot" (Day 1 night). The player and the reader learn the rules by watching.

## 8. Linter checks (`npm run lint:story`)

Schema (`engine/schema.ts`, rejects a scene before the graph is checked): unknown key, condition/effect with unknown kind or bad shape, scene without exactly one of `choices` / `next` / `end`, choice without exactly one of `to` / `check`, more than 4 choices, duplicate choice ids, choice text > 12 words, more than 3 `who`, a `say` beat without `text` or with an empty `say`, `echo` without exactly one of `after` / `at`.
Errors (graph and references, `scripts/lint*.ts`): duplicate id, id without a `.`, missing target (exits and echoes), unreachable scene, scene with no path to an ending, `$resume` outside an echo scene or an echo scene with another exit, unknown ending id, last ending rule with a condition, missing system scene, unknown flag / character (in `who`, `say`, conditions and effects) / deed tag / background, plus any schema failure. (Items are not checked: there are none yet.)
Errors also: in-world text (scene text, glitch, choice text) contains "zombie" / "undead" (`lintTone.ts`, D23).
Warnings: a chapter of 8+ scenes where more than 15% of scenes ask for a choice (story share under 85%, `lintTone.ts`, D22; the share counts authored scenes, so a route through branches can differ: `tests/prologue.test.ts` checks the real routes of the intro), flag set but never read, flag read but never set, reveal of a secret no scene holds, no honor tag in a chapter, scene text > 90 words, same outcome on all choices (fake choice), every choice has `if`/`lock` (possible soft-lock).

## 9. Authoring workflow with Claude

1. Pick beats from `STORYBOARD.md` (≤ 6 scenes per session).
2. Ask Claude to write one chapter part file + any new flags in `flags.ts`.
3. Run `npm run lint:story` and the chapter's golden-path test.
4. Play it with `?debug=1` and note continuity issues in `HANDOFF.md`.

- **Companion perks (D30).** Do not author `['trait', '+Bruiser']` / `['trait', '-Bruiser']` for a companion's perk: it follows `['party', '+brick']` / `['party', '-brick']`, a `kill` and a walk-out by itself (`story/traits.ts` `PERKS`). `trait` effects are for the player's own traits.
- **Deeds in the Journal (D30).** Every `['honor', tag, witnessed]` is recorded in the Journal's Deeds (last 20). A hidden deed is recorded when it happens and again as "came out" on `['reveal', id]`. Nothing to author.
