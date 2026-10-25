// ui/components/SceneView.tsx — the middle of the stage (UI_UX §3): backdrop plus the story as one web-novel page. Scenes already read stay above, in order (with the choice taken); then the turns read in this scene, then the one being typed. A speaker's lines carry their name. `children` (Continue) go under the text.
import { useEffect, useRef, type ReactNode } from 'react'
import { shortName } from '../names'
import type { ReadChunk, Turn } from '../turns'
import { Backdrop } from './Backdrop'
import { Lines } from './Lines'
interface Props {
  place: string | undefined
  read?: readonly ReadChunk[] // scenes already read
  done?: readonly Turn[] // turns of this scene already read
  now?: Turn | undefined // the turn being read, shown here only when it is narration (a speech turn is in the Dock)
  revealed?: number | undefined // characters of `now` shown so far; undefined = all
  onSkip?: (() => void) | undefined // tapping the text finishes the typing
  children?: ReactNode
}
function Told({ turn }: { turn: Turn }) {
  if (turn.who === undefined) return <Lines lines={turn.lines} />
  return (
    <div className="said">
      <span className="by">{shortName(turn.who)}</span>
      <Lines lines={turn.lines} />
    </div>
  )
}
const caption = (place: string): string => place.replaceAll('_', ' ')
export function SceneView({ place, read = [], done = [], now, revealed, onSkip, children }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const size = read.length * 1000 + done.length * 10 + (now === undefined ? 0 : 1)
  useEffect(() => {
    const el = box.current
    if (el !== null) el.scrollTop = el.scrollHeight // the newest text is always in view
  }, [size])
  const last = read[read.length - 1]?.place
  return (
    <section className="scene">
      <Backdrop name={place} />
      <div className="story" ref={box}>
        <div className="story-flow">
          {read.map((c, i) => (
            <div key={c.key} className="read">
              {c.place !== undefined && c.place !== read[i - 1]?.place && <span className="place">{caption(c.place)}</span>}
              {c.turns.map((t, j) => <Told key={j} turn={t} />)}
              {c.picked !== undefined && <p className="picked">{c.picked}</p>}
            </div>
          ))}
          {place !== undefined && place !== last && <span className="place">{caption(place)}</span>}
          <div className="narration" aria-live="polite" onClick={onSkip}>
            {done.map((t, i) => <Told key={i} turn={t} />)}
            {now !== undefined && <Lines lines={now.lines} revealed={revealed} />}
          </div>
          {children}
        </div>
      </div>
    </section>
  )
}
