// ui/components/Toast.tsx — consequence lines under the narration, auto-dismissed after 2.5 s (UI_UX §3, §7)
import { useEffect, useState } from 'react'
export const TOAST_MS = 2500
export function Toast({ lines, seq }: { lines: readonly string[]; seq: number }) {
  const [dismissed, setDismissed] = useState(-1)
  useEffect(() => {
    if (lines.length === 0) return
    const t = setTimeout(() => setDismissed(seq), TOAST_MS)
    return () => clearTimeout(t)
  }, [lines, seq])
  const show = lines.length > 0 && dismissed !== seq
  return (
    <div className="toasts" role="status" aria-live="polite">
      {show && lines.map((l) => <p key={l} className="toast">{l}</p>)}
    </div>
  )
}
