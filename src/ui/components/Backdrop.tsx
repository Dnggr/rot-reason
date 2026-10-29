// ui/components/Backdrop.tsx — full-screen background layer: a gradient placeholder, plus an optional WebP at /bg/<name>.webp (a missing file just leaves the gradient; never an error)
import type { CSSProperties } from 'react'
const safe = (name: string): string => name.replace(/[^a-zA-Z0-9_-]/g, '')
export function Backdrop({ name }: { name: string | undefined }) {
  const key = name === undefined ? '' : safe(name)
  const style = key === '' ? undefined : ({ '--bg-img': `url(/bg/${key}.webp)` } as CSSProperties)
  return <div className="backdrop" data-bg={key} style={style} aria-hidden="true" />
}