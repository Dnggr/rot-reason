// ui/strings.ts — every UI label in one place (keeps translation and copy edits easy)
import type { Odds } from '../engine/checks'
import type { AttrKey, Mood, Phase, ResKey, StatKey, Tier, Tone } from '../engine/types'
import type { Settings, TextSize } from './settings'
const day = 'Day'
const tier: Record<Tier, string> = { T1: 'Infamous', T2: 'Feared', T3: 'Unknown', T4: 'Respected', T5: 'Revered' }
const tone: Record<Tone, string> = { mercy: 'Mercy', lie: 'Lie', threaten: 'Threaten', brave: 'Brave', quiet: 'Quiet', honest: 'Honest', cold: 'Cold' }
const odds: Record<Odds, string> = { risky: 'Risky', even: 'Even', likely: 'Likely' }
const res: Record<ResKey, string> = { food: 'Food', ammo: 'Ammo', meds: 'Meds' }
const stat: Record<StatKey, string> = { hp: 'HP', reason: 'Reason', rot: 'Rot' }
const attr: Record<AttrKey, string> = { grit: 'Grit', wits: 'Wits', heart: 'Heart' }
const phase: Record<Phase, string> = { dawn: 'Dawn', day: 'Day', dusk: 'Dusk', night: 'Night' }
const sizes: Record<TextSize, string> = { S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra large' }
const toggles: Record<Exclude<keyof Settings, 'textSize'>, { label: string; hint: string }> = {
  soften: { label: 'Soften violence', hint: 'Used by scenes that have a softer version. None do yet.' },
  reducedMotion: { label: 'Reduce motion', hint: 'No typing effect, pulses or flicker.' },
  highContrast: { label: 'High contrast', hint: 'Brighter text and borders.' },
  sound: { label: 'Sound', hint: 'Off by default. This build has no audio yet.' },
}
const mood: Record<Mood, string> = { calm: 'Calm', tense: 'Tense', dread: 'Dread', warm: 'Warm', glitch: 'Glitch' }
// Ending titles (STORYBOARD §4). Companion epilogues will need authored text in src/story (M6).
const endings: Record<string, string> = {
  beacon: 'Beacon', warden_of_the_dead: 'Warden of the Dead', broken_reason: 'Broken Reason', rot_within: 'Rot Within',
  last_seat: 'Last Seat', lighthouse: 'The Lighthouse', death: 'You did not make it',
}
const journal = {
  title: 'Journal', open: 'Journal', close: 'Close', deeds: 'Deeds', people: 'People', party: 'With you', others: 'Others',
  deedsEmpty: 'Nothing yet. What you do is remembered here.', peopleEmpty: 'Nobody yet.',
  seen: 'Seen', unseen: 'Unseen', cameOut: 'Came out', day: (d: number): string => `Day ${d}`,
  honor: (n: number): string => `Honor ${n > 0 ? `+${n}` : n}`, noChange: 'No change in honor', reacted: 'Reacted:',
  inParty: 'With you', dead: 'Dead', trust: 'Trust', fear: 'Fear', perk: 'Perk',
  trustLabel: (who: string, n: number): string => `${who}'s trust ${n} of 100`, fearLabel: (who: string, n: number): string => `${who}'s fear ${n} of 100`,
} as const
const banner = { dismiss: 'Continue' } as const
export const S = {
  title: 'Rot & Reason',
  tagline: 'Every choice costs something.',
  loading: 'Loading Marrow Bay...',
  newGame: 'New game',
  eraseAndStart: 'Erase save and start over?',
  continue: 'Continue',
  begin: 'Begin',
  back: 'Back',
  menu: 'Menu',
  choicesTitle: 'Choices',
  settings: 'Settings',
  textSize: 'Text size',
  sizes, toggles,
  resetSave: 'Reset saved game',
  eraseSave: 'Erase the saved game? Tap again.',
  noSaveToErase: 'There is no saved game to erase.',
  resetFromTitle: 'To erase the saved game, open Settings from the title screen.',
  settingsDamaged: 'Your settings could not be read, so the defaults are in use.',
  settingsNotSaved: 'Could not save your settings.',
  toTitle: 'Title screen',
  nameLabel: 'Your name',
  defaultName: 'Ash',
  chooseBackground: 'Who were you before today?',
  trait: 'Trait',
  kit: 'Kit',
  kitEmpty: 'nothing',
  honor: 'Honor',
  day,
  tier, tone, odds, res, stat, attr, phase, mood, journal, banner,
  cantAfford: 'Not enough',
  theEnd: 'The end',
  recap: 'Your run',
  noStorage: 'This browser blocks saving. Your progress will be lost when you close the page.',
  saveFailed: 'Could not save your progress.',
  saveBroken: 'Your saved game could not be loaded. Start a new game.',
  recovered: 'Recovered from an earlier point.',
  healed: 'Updated for this version of the game.', // a save the story outgrew was repaired on load (D34)
  errorTitle: 'Something broke',
  errorBody: 'The game hit an error. Copy the debug report and send it with a note on what you did.',
  errorMissing: 'The story lost its place. Copy the debug report, then restart the chapter.',
  copyReport: 'Copy debug report',
  copied: 'Copied',
  copyByHand: 'Copy was blocked. Select this text and copy it by hand.',
  restartChapter: 'Restart chapter',
  reload: 'Reload',
  storyFailed: 'The story failed to load.',
  chapter: (c: string): string => `Chapter ${c}`,
  dayPhase: (d: number, p: Phase): string => `${day} ${d} ${phase[p]}`,
  remember: (who: string): string => `${who} will remember that`,
  joins: (who: string): string => `${who} joins you`,
  leaves: (who: string): string => `${who} leaves you`,
  hpLabel: (n: number, max: number): string => `HP ${n} of ${max}`,
  ending: (id: string): string => endings[id] ?? id,
  lock: {
    generic: 'Locked',
    needs: (x: string): string => `Needs ${x}`,
    atLeast: (l: string, n: number): string => `${l} ${n}+`,
    atMost: (l: string, n: number): string => `${l} ${n} or lower`,
    exactly: (l: string, n: number): string => `${l} ${n}`,
    tierUp: (t: string): string => `${t} or higher`,
    tierDown: (t: string): string => `${t} or lower`,
    trust: (who: string): string => `Needs ${who}'s trust`,
    fear: (who: string): string => `${who} must fear you`,
    withYou: (who: string): string => `Needs ${who} with you`,
    alive: (who: string): string => `${who} must be alive`,
  },
} as const
