// ui/confirm.ts — the two-tap rule for an action that replaces the saved game (UI_UX §2, D31, D33): the first tap arms the button, the second fires; a blur or ARM_MS of waiting disarms it. Pure.
export interface Tap {
  armed: boolean // the button now asks "are you sure?"
  fire: boolean // run the action
}
export type ConfirmEvent = 'tap' | 'blur' | 'timeout'
export const ARM_MS = 4000 // an armed button relaxes after this long; browsers that never focus a tapped button (Safari) get no blur, so the timer is the sure part
export function step(armed: boolean, event: ConfirmEvent): Tap {
  if (event !== 'tap') return { armed: false, fire: false } // blur and timeout only ever disarm
  return armed ? { armed: false, fire: true } : { armed: true, fire: false }
}
export const tap = (armed: boolean): Tap => step(armed, 'tap')