// story/chapters/prologue.ts — Prologue part 1, "Fever Dreams" (Day 1): the story-first intro. Nobody here has a word for what is happening (D22, D23). Hands off to the test chapter until M4.
import type { Scene } from '../../engine/types'
export const scenes: Scene[] = [
  {
    id: 'p.dream', mood: 'dread', place: 'fever_dream',
    text: [
      'A bell is ringing under water. Each stroke reaches you late, climbing up through the dark.',
      'Someone knocks. Three slow knocks, a wait, three more. Whoever it is has all the time in the world.',
      'A voice says your name from the wrong side of the door.',
    ],
    next: 'p.wake',
  },
  {
    id: 'p.wake', mood: 'calm', place: 'bedroom',
    text: [
      'You wake with the sheet glued to your back. The fever broke in the night. The clock says 6:12.',
      'Nothing is wrong, exactly. That is the first thing that is wrong.',
      { if: ['bg', 'dockworker'], text: 'No cranes. Six years of steel grinding you awake, and this morning you can hear your own pulse.' },
      { if: ['bg', 'mechanic'], text: 'No generators, no vans, no compressors. A city of engines, and not one of them running.' },
      { if: ['bg', 'teacher'], text: 'No buses braking at the corner. The street is missing the sound of children running late.' },
    ],
    next: 'p.phone',
  },
  {
    id: 'p.phone', mood: 'tense', place: 'bedroom',
    text: [
      'Your phone has two bars and eleven missed calls.',
      { if: ['bg', 'dockworker'], text: 'The foreman, 4:40 a.m.: "Don\'t come in. Pier 9 is shut. Nobody goes near the—" Then nothing.' },
      { if: ['bg', 'mechanic'], text: 'The garage owner, 5:02 a.m.: "Whatever you see out there, don\'t go help. I mean it."' },
      { if: ['bg', 'teacher'], text: 'The school office, a recording: "Classes are suspended. A public health matter. Stay indoors."' },
      'You dial the emergency line. A calm voice says all operators are busy, asks you not to approach anyone who is ill, and starts over.',
    ],
    next: 'p.tv',
  },
  {
    id: 'p.tv', mood: 'tense', place: 'living_room',
    text: [
      'The TV is on, muted, where you left it. A morning anchor sits very straight, mouth open on half a word.',
      'She turns toward something off camera. Her hand goes to her ear. The picture lurches to color bars, then a map of the harbor district, striped red.',
      'The ticker crawls: STAY INDOORS. DO NOT APPROACH THE SICK. Nobody says what the sickness is.',
    ],
    next: 'p.below',
  },
  {
    id: 'p.below', mood: 'dread', place: 'sill', on: [['stat', 'reason', -2]],
    text: [
      'Four floors down the street is empty, except for a woman in a pale-blue bathrobe, standing in the middle of the road.',
      'A car noses around the corner and leans on its horn. She does not flinch. Then her head turns toward the sound, slowly, and her body follows a moment late.',
      'The horn dies. The car backs up the whole block. She keeps facing where the sound was, like a needle holding north.',
    ],
    next: 'p.building',
  },
  {
    id: 'p.building', mood: 'tense', place: 'hallway', on: [['stat', 'reason', -3]],
    text: [
      'The building wakes in small noises: a faucet, a radio, a couple arguing about whether to leave.',
      'At 9:40 a man downstairs starts shouting, "He won\'t stop, he won\'t," and a door slams over the rest.',
      'After that the quiet climbs through the floors one landing at a time, like water filling a tub.',
    ],
    next: 'p.whine',
  },
  {
    id: 'p.whine', mood: 'tense', place: 'hallway',
    text: [
      'Around ten there is a new sound: a dog whining behind the stairwell door at the end of your hall. It never barks. It only whines, thin and steady.',
      'After an hour you cannot read, or rest, or think around it. You press your ear to the fire door.',
      'Scrabbling. A collar tag, ringing. Far below, something heavy shifts its weight.',
    ],
    next: 'p.stairs',
  },
  {
    id: 'p.stairs', mood: 'tense', place: 'stairwell', who: ['biscuit'],
    text: [
      'You open the fire door a hand\'s width. Cold air, wet concrete. Two flights down, a scruffy brown mutt hangs by his leash from the railing, paws scrabbling.',
      'One flight below him a woman stands with her face to the wall. Pale-blue bathrobe. She is not moving. The dog has stopped whining.',
    ],
    choices: [
      { id: 'a', tone: 'quiet', text: 'Whisper him calm, ease down, and unclip him.',
        check: { attr: 'heart', dc: 7,
          pass: { fx: [['party', '+biscuit'], ['trust', 'biscuit', 15], ['stat', 'reason', 5]], to: 'p.landing' },
          fail: { fx: [['party', '+biscuit'], ['trust', 'biscuit', 10], ['stat', 'hp', -1], ['set', 'stairs_noise']], to: 'p.landing' } } },
      { id: 'b', tone: 'brave', text: 'Take the stairs fast, haul him loose, and run.',
        check: { attr: 'grit', dc: 7,
          pass: { fx: [['party', '+biscuit'], ['trust', 'biscuit', 15], ['stat', 'reason', 5]], to: 'p.landing' },
          fail: { fx: [['party', '+biscuit'], ['trust', 'biscuit', 10], ['stat', 'hp', -1], ['set', 'stairs_noise']], to: 'p.landing' } } },
      { id: 'c', tone: 'cold', text: 'Shut the door. You cannot risk the noise.', fx: [['set', 'biscuit_left'], ['stat', 'reason', -5]], to: 'p.landing' },
    ],
  },
  {
    id: 'p.landing', mood: 'tense', place: 'hallway',
    text: [
      { if: ['flag', 'biscuit_left'], text: 'You lean on the shut door. The whining starts again, fainter, and stops. You stay there a long time anyway.' },
      { if: { all: [['party', 'biscuit'], { not: ['flag', 'stairs_noise'] }] }, text: 'He comes up against your leg, shaking, without a sound. Below you the bathrobe never turns.' },
      { if: ['flag', 'stairs_noise'], text: 'A stair rings like a struck pipe. Below, the bathrobe turns its head, only its head. You haul the dog up, and the stairs take a piece of your ankle.' },
      'You ease the fire door shut. The click is loud as a shot. Nothing answers it.',
    ],
    next: 'p.bowl',
  },
  {
    id: 'p.bowl', mood: 'warm', place: 'kitchen', time: { day: 1, phase: 'day' },
    text: [
      { if: ['party', 'biscuit'], text: 'You give him water in a mixing bowl. He drinks like it is a job, then leans on your shin.' },
      { if: ['party', 'biscuit'], text: 'The tag says DOLE, 3B. On the back, in marker: BISCUIT. 3B plays ballgames too loud.' },
      { if: ['flag', 'biscuit_left'], text: 'You eat standing up, listening for a sound that does not come.' },
      { if: ['bg', 'dockworker'], text: 'One real meal and some crackers. You count them twice.' },
      { if: ['bg', 'mechanic'], text: 'Coffee and dust. In a drawer, one round from a rifle you sold years ago.' },
      { if: ['bg', 'teacher'], text: 'Two strips of fever tablets, left from your week in bed.' },
    ],
    next: 'p.knock',
  },
  {
    id: 'p.knock', mood: 'dread', place: 'front_door', who: ['dole'],
    text: [
      'Early afternoon. Three slow knocks on your door. A wait. Three more.',
      'It is the knock from your dream, and for a second you cannot move.',
      'Through the peephole, warped and bright: Dole from 3B, his forearm wrapped in a dish towel gone dark and wet. He holds it up like something he is not sure is his.',
      { if: ['party', 'biscuit'], text: 'Behind you, Biscuit goes under the table and does not come out.' },
    ],
    next: 'p.dole',
  },
  {
    id: 'p.dole', mood: 'tense', place: 'front_door', who: ['dole'],
    text: [
      { say: 'dole', text: '"Hey, it\'s Walt, 3B."' },
      'His voice is wet and too bright.',
      { say: 'dole', text: '"A man got me on the stairs. I hit him with my keys, hard, and he just kept—"' },
      { say: 'dole', text: '"I\'m burning up. I just need to sit down somewhere."' },
      'He leans his forehead on the door and, without noticing, knocks again. Three slow ones. Polite. Patient.',
      { if: ['party', 'biscuit'], text: 'Under the table, a thin, steady whine. It is not a happy sound.' },
    ],
    choices: [
      { id: 'a', tone: 'mercy', text: 'Unbolt the door and walk him to the bathroom.', fx: [['honor', 'mercy', true], ['set', 'dole_inside']], echo: { scene: 'p.dole_knocks', after: 2 }, to: 'p.dole_in' },
      { id: 'b', tone: 'cold', text: 'Keep the bolt on. Tell him you cannot help.', fx: [['honor', 'abandon', true], ['set', 'dole_out']], to: 'p.dole_out' },
      { id: 'c', tone: 'honest', text: 'Tell him no, then point him to St. Brigid\'s.', fx: [['honor', 'honest', true], ['set', 'dole_sent'], ['stat', 'reason', -3]], to: 'p.dole_sent' },
    ],
  },
  {
    id: 'p.dole_in', mood: 'warm', place: 'bathroom', who: ['dole'],
    text: [
      'You slide the bolt. Dole comes in sideways, like a man crossing a boat, and points at the bathroom. You walk him there.',
      'He sits on the edge of the tub and runs the cold tap over his head. He talks: his late wife\'s recipes, Biscuit\'s bad hip, the hospital wristband on the man from the stairs.',
      { say: 'dole', text: '"I\'ll just rest a minute."' },
      'You pull the door to, for his dignity, and sit outside it with your back to the wall.',
    ],
    next: 'p.hours',
  },
  {
    id: 'p.dole_out', mood: 'dread', place: 'front_door', who: ['dole'],
    text: [
      { say: 'dole', text: '"I understand."' },
      'He says it in the voice of a man who does not.',
      { say: 'dole', text: '"You\'ve been sick too. I heard you coughing."' },
      'You listen to him slide down the other side of your door until he is sitting on the landing.',
      { if: ['party', 'biscuit'], text: 'Under the table Biscuit makes a sound you have never heard from a dog. He does not go to the door.' },
      'After a while he stops talking. You do not hear him leave.',
    ],
    next: 'p.hours',
  },
  {
    id: 'p.dole_sent', mood: 'calm', place: 'front_door', who: ['dole'],
    text: [
      { say: 'dole', text: '"St. Brigid\'s."' },
      'He repeats it as if you had handed him a password.',
      { say: 'dole', text: '"Sure. That\'s smart."' },
      'He wipes his face with his good hand.',
      { if: ['party', 'biscuit'], say: 'dole', text: '"If you\'ve got my dog, keep him till I\'m back. He likes the heel of a sandwich."' },
      { if: ['party', 'biscuit'], text: 'He laughs, and it turns into a cough.' },
      'You listen to him go: the slippers, the stairwell door, his weight on the first step. Then nothing. You wait for the second step.',
    ],
    next: 'p.hours',
  },
  {
    id: 'p.hours', mood: 'tense', place: 'living_room', time: { day: 1, phase: 'dusk' },
    text: [
      'The afternoon goes sideways. You eat standing up and wash one cup twice. Smoke stands over the harbor in three places, straight as pencils.',
      'The sirens thin out, each one farther off than the last, like guests leaving a party.',
      { if: ['flag', 'dole_inside'], text: 'You listen at the bathroom door. The tap ran, then stopped. You tell yourself this is what sleep sounds like.' },
      { if: ['flag', 'dole_out'], text: 'Twice you check the peephole. The landing is empty, which is somehow worse.' },
      { if: ['flag', 'dole_sent'], text: 'Twice you almost go after him. Twice you tell yourself he is a grown man.' },
    ],
    next: 'p.dusk',
  },
  {
    id: 'p.dole_knocks', tags: ['echo'], mood: 'dread', place: 'bathroom_door', who: ['dole'], on: [['stat', 'reason', -10]],
    text: [
      'Three slow knocks. From inside the bathroom.',
      'You are on your feet. You say his name through the wood. The tap is off, and nobody answers. A wait. Three more. Polite. Patient.',
      { if: ['party', 'biscuit'], text: 'Biscuit has gone flat under the table, shaking.' },
      'Your hand finds the knob and knows something you do not. You drag a kitchen chair under the handle instead. It is the first thing all day you have done without a reason.',
      'Behind the chair, the knocking keeps its time.',
    ],
    next: '$resume',
  },
  {
    id: 'p.dusk', mood: 'tense', place: 'sill',
    text: [
      'At five the power dies. The fridge shudders and goes still. Across the water, the red lamps on the cranes blink out in one long ripple.',
      { if: ['flag', 'dole_inside'], text: 'In the bathroom the knocking has not changed pace once. Polite. Patient.' },
      { if: ['flag', 'dole_out'], text: 'Outside your door, three slow knocks. A wait. Three more. He has stopped asking.' },
      { if: ['flag', 'dole_sent'], text: 'Nobody knocks. You keep waiting for it, and the waiting is its own noise.' },
      'You light the camping lantern low. You keep your voice lower, though you could not say who from.',
    ],
    next: 'p.bell',
  },
  {
    id: 'p.bell', mood: 'dread', place: 'sill', on: [['stat', 'reason', -5]], time: { day: 1, phase: 'night' },
    text: [
      'Across the water a church bell rings, stroke after stroke, like it has a reason. The bell from your dream.',
      'They come out of doorways and cars and alley mouths, alone and in dozens. They do not run or talk. They all walk toward the bell, like a congregation late for service.',
      'The woman in the bathrobe is among them, head tilted, listening with her whole body.',
      'The bell stops. So do they. A thousand people stand in the dark street, facing one way. You are holding your breath.',
    ],
    next: 'p.static',
  },
  {
    id: 'p.static', mood: 'tense', place: 'bedroom',
    text: [
      'You find the crank radio in the hall closet, bought for storms. You wrap it in a towel against the whir, and crank until the dial hisses.',
      'Static. A preacher. Static. Then a flat male voice, calm as an elevator:',
      '"Haven. Pier 9, Day 21, limited manifest. Exposure to the Rot is not a reason to delay. Haven. Pier 9, Day 21—"',
    ],
    next: 'p.voice',
  },
  {
    id: 'p.voice', mood: 'tense', place: 'bedroom', who: ['juno'],
    text: [
      'A girl breaks in over the loop, young and dry and out of breath.',
      { say: 'juno', text: '"That was the recording. Same eleven seconds since four a.m. I\'m not on it. I\'m on top of it, which is illegal."' },
      { say: 'juno', text: '"If you can hear me: don\'t ring anything, start anything, or shout. Whatever they are, they follow noise. I don\'t have a word for them. Nobody does."' },
      { say: 'juno', text: '"But the recording does. \'The Rot.\' That man had a name ready before any of us had a problem. Think about that, then sleep."' },
    ],
    next: 'p.radio',
  },
  {
    id: 'p.radio', mood: 'tense', place: 'bedroom', who: ['juno'],
    text: [
      'She is gone. The loop starts again: Haven. Pier 9. Day 21. A name like a warm room with a door that locks.',
      'Twenty days of this city lie between you and a ship. You have to decide what the flat voice is to you.',
    ],
    choices: [
      { id: 'a', tone: 'brave', text: 'Believe it. Somebody has a plan, and a pier.', fx: [['set', 'heard_haven'], ['set', 'haven_trust'], ['stat', 'reason', 5]], to: 'p.night' },
      { id: 'b', tone: 'honest', text: 'Doubt it. They named the thing before we knew it existed.', fx: [['set', 'heard_haven'], ['set', 'haven_doubt'], ['stat', 'reason', 3]], to: 'p.night' },
      { id: 'c', tone: 'quiet', text: 'Switch it off. Sound is what called them.', fx: [['set', 'heard_haven'], ['set', 'radio_off'], ['stat', 'reason', 2]], to: 'p.night' },
    ],
  },
  {
    id: 'p.night', mood: 'dread', place: 'bedroom',
    text: [
      { if: ['flag', 'haven_trust'], text: 'You mouth it until it becomes a lullaby: Pier 9, Day 21.' },
      { if: ['flag', 'haven_doubt'], text: 'You lie awake with the name like a stone in your mouth.' },
      { if: ['flag', 'radio_off'], text: 'Without the radio, you hear the lantern ticking as it cools.' },
      { if: ['flag', 'dole_inside'], text: 'Behind the chair, the knocking goes on. You count it.' },
      { if: ['flag', 'dole_out'], text: 'Past the bolted door, three knocks, a wait, three more.' },
      { if: ['flag', 'dole_sent'], text: 'No one knocks. You are almost sure that is good news.' },
      { if: ['party', 'biscuit'], text: 'Biscuit curls against your back.' },
      'Past midnight, the sleep you did not mean to take takes you.',
    ],
    next: 't.wake',
  },
]
