// ui/turns.ts — pure: groups a scene's beats into turns, one per speaker change (a turn is what the player reads before one Continue), and the ReadChunk kept after a scene (UI_UX §3).
import type { BeatView } from '../engine/select'
export interface Turn {
  who: string | undefined // the character talking; undefined = narration
  lines: string[]
}
// A scene the player has already read: kept above the current one, like the pages of a web novel (UI_UX §3).
export interface ReadChunk {
  key: number // the step it was read at (unique within a run)
  place: string | undefined
  turns: Turn[]
  picked: string | undefined // the text of the choice taken to leave it
}
// Neighbouring beats with the same speaker (or all narration) share one turn.
export function turnsOf(beats: readonly BeatView[]): Turn[] {
  const out: Turn[] = []
  for (const b of beats) {
    const last = out.at(-1)
    if (last !== undefined && last.who === b.say) last.lines.push(b.text)
    else out.push({ who: b.say, lines: [b.text] })
  }
  return out
}
