// ui/turns.ts — pure: groups a scene's beats into turns, one per speaker change. A turn is what the player reads before one Continue (UI_UX §3).
import type { BeatView } from '../engine/select'
export interface Turn {
  who: string | undefined // the character talking; undefined = narration
  lines: string[]
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
