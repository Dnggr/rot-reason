# STORY FORMAT (the data contract)

Story is **TypeScript data** (typed, autocompleted, validated by Zod (`engine/schema.ts`, live since M1 s1) + linter). Engine reads it; engine never contains prose.
One file per chapter part, ≤ 400 lines. Files export `scenes: Scene[]` through `defineScenes([...])`.

## 1. IDs
- Scenes: `<chapter>.<name>` e.g. `c2.crypt`. Chapter gate scene is always `<chapter>.gate`.
- Choices: unique inside the scene: `a`, `b`, `c`, `d`.
- Flags: `snake_case`, registered in `src/story/flags.ts` with a one-line meaning. Unregistered flag = lint error.
- Characters, items, factions: lowercase ids from their data files.

## 2. Scene
| Field | Required | Meaning |
|---|---|---|
| `id` | yes | unique |
| `text` | yes | `string` or `Beat[]`. Beat = `string` or `{ if, text }` for conditional lines |
| `who` | no | characters on screen (portraits), max 3 |
| `place` | no | background key (`"church_nave"`) |
| `mood` | no | `calm`, `tense`, `dread`, `warm`, `glitch` (drives UI style) |
| `on` | no | effects applied on entering the scene |
| `choices` | yes* | 1-4 choices. *Not for `next`/`end` scenes |
| `next` | no | auto-continue to a scene id (use for narration-only beats) |
| `end` | no | ending id, final scene |
| `time` | no | `{ day?, phase? }` clock change |
| `tags` | no | `camp`, `gate`, `hub`, `echo` (used by tooling) |

## 3. Choice
| Field | Meaning |
|---|---|
| `text` | ≤ 12 words |
| `tone` | `mercy`, `lie`, `threaten`, `brave`, `quiet`, `honest`, `cold` (UI tag) |
| `if` | condition to **show** (otherwise hidden) |
| `lock` | condition to **enable**; if false, shown disabled with the reason |
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

## 8. Linter checks (`npm run lint:story`)
Schema (`engine/schema.ts`, rejects a scene before the graph is checked): unknown key, condition/effect with unknown kind or bad shape, scene without exactly one of `choices` / `next` / `end`, choice without exactly one of `to` / `check`, more than 4 choices, duplicate choice ids, choice text > 12 words, more than 3 `who`, `echo` without exactly one of `after` / `at`.
Errors: duplicate id, missing target, unreachable scene, scene with no exit, unknown flag/char/item/tag, `echo` pointing to missing scene, plus any schema failure.
Warnings: flag set but never read, flag read but never set, no honor tag in a chapter, scene text > 90 words, same `fx` on all choices (fake choice).

## 9. Authoring workflow with Claude
1. Pick beats from `STORYBOARD.md` (≤ 6 scenes per session).
2. Ask Claude to write one chapter part file + any new flags in `flags.ts`.
3. Run `npm run lint:story` and the chapter's golden-path test.
4. Play it with `?debug=1` and note continuity issues in `HANDOFF.md`.
