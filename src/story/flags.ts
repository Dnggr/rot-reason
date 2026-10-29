// story/flags.ts — flag registry: every flag a scene sets or reads, with a one-line meaning. An unregistered flag is a lint error.
export const FLAGS: Readonly<Record<string, string>> = {
  dole_inside: 'Prologue: Dole was let in (he is shut in the bathroom and knocks).',
  dole_out: 'Prologue: Dole was kept out on the landing.',
  dole_sent: 'Prologue: Dole was sent to St. Brigid\'s.',
  stairs_noise: 'Prologue: the rescue of Biscuit went loudly (cost 1 HP).',
  biscuit_left: 'Prologue: the player shut the stairwell door on Biscuit.',
  heard_haven: 'The player heard the Haven broadcast on Day 1 night.',
  haven_trust: 'Prologue: the player chose to believe Haven.',
  haven_doubt: 'Prologue: the player doubted Haven (it had a name before the city had a problem).',
  radio_off: 'Prologue: the player switched the radio off (sound draws them).',
  test_started: 'Test chapter: the player has left the apartment.',
  final_lead: 'Final choice: lead the crowd out (Beacon needs it).',
  final_stay: 'Final choice: stay and hold the pier (Lighthouse needs it).',
  broadcast_changed: 'The player changed what the Haven broadcast says.',
  route_fear: 'The player took the Fear route at Pier 9.',
  nora_turned: 'Nora turned (Rot Within).',
}