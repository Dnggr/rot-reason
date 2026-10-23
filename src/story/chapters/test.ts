// story/chapters/test.ts — the 5-scene test chapter: every effect kind, a check, a lock, a secret, an echo scene, an auto ending. Deleted in M4.
import type { Scene } from '../../engine/types'
export const scenes: Scene[] = [
  {
    id: 't.wake', who: ['nora'], mood: 'tense', on: [['set', 'test_started']],
    text: [
      'Sirens drag you out of sleep. Smoke leaks under the door, and someone knocks, slow and patient.',
      { if: ['flag', 'dole_inside'], text: 'Behind you, the bathroom door knocks back, in time.' },
      { if: ['flag', 'dole_out'], text: 'You think of Dole on the landing, and your stomach drops.' },
      'Through the peephole: a woman in scrubs and a stolen parka, hands raised, a heavy pack at her feet.',
      { if: ['bg', 'dockworker'], text: 'You know this stairwell blind. You have hauled worse than a stuck door.' },
      { if: ['bg', 'teacher'], text: 'You have talked down angrier voices than hers.' },
    ],
    choices: [
      { id: 'a', tone: 'mercy', text: 'Let her in and share your food.', cost: { food: 1 }, fx: [['honor', 'share', true], ['trust', 'nora', 10], ['party', '+nora']], to: 't.street' },
      { id: 'b', tone: 'cold', text: 'Take her pack through the gap, then bar the door.', fx: [['honor', 'steal', false], ['secret', 'stolen_meds'], ['res', 'meds', 2]], to: 't.street' },
      { id: 'c', tone: 'brave', text: 'Shoulder through the barricade and run.', check: { attr: 'grit', dc: 5, pass: { fx: [['stat', 'reason', 5]], to: 't.street' }, fail: { fx: [['stat', 'hp', -1]], to: 't.street' } } },
    ],
  },
  {
    id: 't.street', who: ['brick'], mood: 'dread', glitch: 'The street breathes. The bell says your name, and the bus is smiling.',
    text: [
      'The street is a river of headlights and shouting. A bus lies across the intersection, doors open, and somewhere a bell keeps ringing.',
      'A huge man in the bus doorway holds a paperback in one fist and watches you.',
      { if: ['party', 'nora'], text: 'Nora stays close, counting people under her breath.' },
      { if: ['secret', 'stolen_meds'], text: 'The stolen pack weighs on your shoulder like a verdict.' },
      { if: ['flag', 'test_started'], text: 'Behind you, your door hangs open on its hinges.' },
    ],
    choices: [
      { id: 'a', tone: 'threaten', text: 'Level your gun at the big man.', cost: { ammo: 1 }, lock: ['stat', 'reason', '>=', 20],
        fx: [['honor', 'intimidate', true], ['fear', 'brick', 15], ['party', '+brick'], ['trait', '+Bruiser'], ['echo', { scene: 't.echo', after: 1 }]], to: 't.gate' },
      { id: 'b', tone: 'honest', text: 'Confess what you took from the nurse.', if: ['secret', 'stolen_meds'], fx: [['reveal', 'stolen_meds'], ['honor', 'honest', true], ['trust', 'nora', -5]], to: 't.gate' },
      { id: 'c', tone: 'quiet', text: 'Send Nora back upstairs alone.', if: ['party', 'nora'], fx: [['party', '-nora'], ['honor', 'abandon', true], ['trust', 'nora', -20]], to: 't.gate' },
      { id: 'd', tone: 'quiet', text: 'Slip past the bus without a sound.', fx: [['time', { day: 1, phase: 'night' }]], echo: { scene: 't.echo', after: 1 }, to: 't.gate' },
    ],
  },
  {
    id: 't.gate', tags: ['gate'], mood: 'calm', time: { day: 2, phase: 'dawn' },
    text: [
      'The bell stops. In the hush a loudspeaker repeats its promise: Pier 9, Day 21, six seats. Everyone around you stands still and listens.',
      { if: ['flag', 'heard_haven'], text: 'You know that flat voice. It said these same words to you on the radio, in this same order, to the syllable.' },
      { if: ['party', 'brick'], text: 'Brick folds the corner of his page and says nothing.' },
      { if: ['tier', '<=', 'T2'], text: 'People step away from you. Nobody says why.' },
    ],
    choices: [
      { id: 'a', tone: 'brave', text: 'Rally the crowd to follow you out.', fx: [['set', 'final_lead'], ['trust', 'brick', 10]], to: 't.end' },
      { id: 'b', tone: 'honest', text: 'Hold the pier and rebroadcast the truth.', fx: [['set', 'final_stay'], ['set', 'broadcast_changed'], ['clear', 'test_started']], to: 't.end' },
      { id: 'c', tone: 'cold', text: 'Leave them all and take the bus alone.', fx: [['honor', 'abandon', true], ['kill', 'nora'], ['set', 'route_fear'], ['set', 'nora_turned'], ['trait', '-Bruiser']], to: 't.end' },
      { id: 'd', tone: 'brave', text: 'Charge the horde and hold it off.', fx: [['honor', 'sacrifice', true], ['stat', 'hp', -5]], to: 't.end' },
    ],
  },
  {
    id: 't.echo', tags: ['echo'], mood: 'dread', on: [['stat', 'reason', -5]],
    text: [
      'A gray figure detaches from the crowd, knocking on a lamppost as if it were a door. Three slow knocks. A wait. Three more. Nobody else seems to hear it.',
      { if: ['flag', 'dole_inside'], text: 'It is not Dole. You shut Dole in your bathroom. This is someone else, and it knocks the same way.' },
      { if: ['flag', 'dole_out'], text: 'It is Dole, in the same slippers. He does not turn when you whisper his name.' },
      { if: ['flag', 'dole_sent'], text: 'It is Dole, in his slippers, a long way from St. Brigid\'s.' },
      { if: ['party', 'nora'], text: 'Nora whispers, "Don\'t look at it. Don\'t answer."' },
    ],
    next: '$resume',
  },
  {
    id: 't.end', mood: 'warm', end: 'auto',
    text: [
      'A ship horn sounds across the water. Whatever you did to get here, the pier remembers.',
      { if: ['tier', '>=', 'T4'], text: 'Strangers make room for you at the rail.' },
    ],
  },
]
