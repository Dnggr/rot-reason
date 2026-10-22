// story/flags.ts — flag registry: every flag a scene sets or reads, with a one-line meaning. An unregistered flag is a lint error.
export const FLAGS: Readonly<Record<string, string>> = {
  test_started: 'Test chapter: the player has left the apartment.',
  final_lead: 'Final choice: lead the crowd out (Beacon needs it).',
  final_stay: 'Final choice: stay and hold the pier (Lighthouse needs it).',
  broadcast_changed: 'The player changed what the Haven broadcast says.',
  route_fear: 'The player took the Fear route at Pier 9.',
  nora_turned: 'Nora turned (Rot Within).',
}
