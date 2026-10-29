// ui/hooks/useKeys.ts — one window keydown listener for the play screen; ui/keys.ts decides what a key means, this only wires it
import { useEffect, useRef } from 'react'
import { keyCommand, type KeyCtx } from '../keys'
export interface KeyActions {
  pick(index: number): void
  skip(): void
  next(): void
  journal(): void
}
export function useKeys(ctx: KeyCtx, act: KeyActions): void {
  const latest = useRef({ ctx, act })
  useEffect(() => {
    latest.current = { ctx, act } // the listener below is added once and always reads the newest props
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.defaultPrevented) return
      const t = e.target instanceof HTMLElement ? e.target : undefined
      const target = t === undefined ? '' : t.isContentEditable ? 'INPUT' : t.tagName
      const cmd = keyCommand({ key: e.key, target, mod: e.ctrlKey || e.metaKey || e.altKey, repeat: e.repeat }, latest.current.ctx)
      if (cmd === undefined) return
      e.preventDefault() // Space must not scroll the page
      const a = latest.current.act
      if (cmd.kind === 'pick') a.pick(cmd.index)
      else if (cmd.kind === 'skip') a.skip()
      else if (cmd.kind === 'next') a.next()
      else a.journal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}