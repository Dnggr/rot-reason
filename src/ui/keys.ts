// ui/keys.ts — play-screen shortcuts (UI_UX §5): 1-4 pick a choice, Space skips typing and then continues, J is the Journal (M3). Pure: the hook feeds it plain data.
import type { View } from '../engine/select'
export interface KeyInput {
  key: string
  target: string // tagName of the focused element, '' for none
  mod: boolean // ctrl / meta / alt held: a browser shortcut, never ours
  repeat: boolean // key held down: ignored, so holding Space cannot run through the story
}
export interface KeyCtx {
  kind: View['kind']
  choices: readonly { enabled: boolean }[]
  typing: boolean // the typewriter is still running
}
export type KeyCmd = { kind: 'pick'; index: number } | { kind: 'skip' } | { kind: 'next' } | { kind: 'journal' }
const FIELDS = ['INPUT', 'TEXTAREA', 'SELECT']
const PRESSABLE = ['BUTTON', 'A', 'SUMMARY'] // Space already presses these; the page does not also act
export function keyCommand(k: KeyInput, c: KeyCtx): KeyCmd | undefined {
  if (k.mod || k.repeat || FIELDS.includes(k.target)) return undefined
  if (/^[1-4]$/.test(k.key)) {
    const index = Number(k.key) - 1
    return c.kind === 'choices' && c.choices[index]?.enabled === true ? { kind: 'pick', index } : undefined
  }
  if (k.key === ' ') {
    if (PRESSABLE.includes(k.target)) return undefined
    if (c.typing) return { kind: 'skip' }
    return c.kind === 'next' ? { kind: 'next' } : undefined
  }
  return k.key === 'j' || k.key === 'J' ? { kind: 'journal' } : undefined
}