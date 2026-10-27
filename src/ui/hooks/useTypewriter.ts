// ui/hooks/useTypewriter.ts — reveals one turn's text a few characters per frame (requestAnimationFrame, UI_UX §10); skippable; disabled means all at once; `paused` holds it still while an overlay (the Journal, the tier banner) covers the page (D32)
import { useCallback, useEffect, useState } from 'react'
import { tick, totalChars, typing } from '../typewriter'
export interface Typewriter {
  count: number // characters to show
  done: boolean
  skip(): void
}
interface St {
  step: number | string // which scene (and turn) this count belongs to
  count: number
  carry: number
}
export function useTypewriter(lines: readonly string[], step: number | string, enabled: boolean, paused = false): Typewriter {
  const total = totalChars(lines)
  const [st, setSt] = useState<St>({ step, count: 0, carry: 0 })
  const fresh = st.step !== step
  if (fresh) setSt({ step, count: 0, carry: 0 }) // a new scene or turn starts from zero (React re-renders at once)
  const count = !enabled ? total : fresh ? 0 : Math.min(st.count, total)
  const done = count >= total
  useEffect(() => {
    if (!typing(done, paused)) return
    let raf = 0
    let last: number | undefined
    const frame = (now: number): void => {
      const dt = last === undefined ? 0 : now - last
      last = now
      setSt((p) => (p.step === step ? { step, ...tick(p, dt, total) } : p))
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [done, paused, step, total])
  const skip = useCallback(() => setSt({ step, count: total, carry: 0 }), [step, total])
  return { count, done, skip }
}
