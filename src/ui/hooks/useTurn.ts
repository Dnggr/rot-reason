// ui/hooks/useTurn.ts — which turn of the scene the player is reading (UI_UX §3); starts at 0 for every scene played, never past the last turn
import { useCallback, useState } from 'react'
export interface TurnState {
  turn: number
  last: boolean // this is the final turn: Continue now leaves the scene, or the choices show
  advance(): void
}
interface St {
  step: number // which scene this turn belongs to
  turn: number
}
export function useTurn(step: number, count: number): TurnState {
  const [st, setSt] = useState<St>({ step, turn: 0 })
  const fresh = st.step !== step
  if (fresh) setSt({ step, turn: 0 }) // a new scene starts at its first turn (React re-renders at once)
  const end = Math.max(0, count - 1)
  const turn = fresh ? 0 : Math.min(st.turn, end)
  const advance = useCallback(() => setSt((p) => ({ step, turn: p.step === step ? p.turn + 1 : 1 })), [step])
  return { turn, last: turn >= end, advance }
}