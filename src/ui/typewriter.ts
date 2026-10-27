// ui/typewriter.ts — the pure parts of the typewriter (UI_UX §7, §10): speed, character count, the time step, when it runs, and the shown / hidden split of the narration lines
export const MS_PER_CHAR = 30 // UI_UX §7; the one knob to tune on a phone
const glyphs = (s: string): string[] => Array.from(s) // by code point, so a character is never cut in half
// It types only while there is text left and nothing covers the page (the Journal, the tier banner: D32).
export const typing = (done: boolean, paused: boolean): boolean => !done && !paused
export const totalChars = (lines: readonly string[]): number => lines.reduce((n, l) => n + glyphs(l).length, 0)
export interface Tick {
  count: number // characters shown
  carry: number // ms left over from the last step
}
// Advances the count by the time that passed; stops at `total`.
export function tick(t: Tick, dtMs: number, total: number, msPerChar: number = MS_PER_CHAR): Tick {
  const ms = t.carry + dtMs
  const n = Math.floor(ms / msPerChar)
  const count = Math.min(total, t.count + n)
  return count >= total ? { count: total, carry: 0 } : { count, carry: ms - n * msPerChar }
}
export interface Split {
  shown: string
  rest: string // still hidden: rendered in the DOM at once (screen readers, tests), only made transparent
}
export function splitLines(lines: readonly string[], count: number): Split[] {
  let left = Math.max(0, count)
  return lines.map((l) => {
    const g = glyphs(l)
    const k = Math.min(left, g.length)
    left -= k
    return { shown: g.slice(0, k).join(''), rest: g.slice(k).join('') }
  })
}
