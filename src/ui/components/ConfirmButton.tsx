// ui/components/ConfirmButton.tsx — a button that asks for a second tap before it acts (UI_UX §2, D31, D33): the first tap swaps its label for `confirm`, the second runs `onConfirm`; blur or ARM_MS of waiting disarms it (rule: ui/confirm.ts `step`)
import { useEffect, useState } from 'react'
import { ARM_MS, step, type ConfirmEvent } from '../confirm'
interface Props {
  label: string
  confirm: string // what the button says after the first tap
  className: string
  onConfirm: () => void
}
export function ConfirmButton({ label, confirm, className, onConfirm }: Props) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return undefined
    const timer = setTimeout(() => setArmed(step(true, 'timeout').armed), ARM_MS)
    return () => clearTimeout(timer)
  }, [armed])
  const on = (event: ConfirmEvent): void => {
    const t = step(armed, event)
    setArmed(t.armed)
    if (t.fire) onConfirm()
  }
  return <button type="button" className={className} onClick={() => on('tap')} onBlur={() => on('blur')}>{armed ? confirm : label}</button>
}