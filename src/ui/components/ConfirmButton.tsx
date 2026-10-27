// ui/components/ConfirmButton.tsx — a button that asks for a second tap before it acts (UI_UX §2, D31): the first tap swaps its label for `confirm`, the second runs `onConfirm` (the rule is ui/confirm.ts `tap`)
import { useState } from 'react'
import { tap } from '../confirm'
interface Props {
  label: string
  confirm: string // what the button says after the first tap
  className: string
  onConfirm: () => void
}
export function ConfirmButton({ label, confirm, className, onConfirm }: Props) {
  const [armed, setArmed] = useState(false)
  const press = (): void => {
    const t = tap(armed)
    setArmed(t.armed)
    if (t.fire) onConfirm()
  }
  return <button type="button" className={className} onClick={press}>{armed ? confirm : label}</button>
}
