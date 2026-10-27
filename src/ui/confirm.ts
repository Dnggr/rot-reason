// ui/confirm.ts — the two-tap rule for an action that replaces the saved game (UI_UX §2, D31): the first tap arms the button, the second fires. Pure.
export interface Tap {
  armed: boolean // the button now asks "are you sure?"
  fire: boolean // run the action
}
export const tap = (armed: boolean): Tap => (armed ? { armed: false, fire: true } : { armed: true, fire: false })
