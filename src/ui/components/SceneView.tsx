// ui/components/SceneView.tsx — the middle of the stage (UI_UX §3): backdrop plus the story as one web-novel page. Scenes already read stay above, in order (with the choice taken); then the turns read in this scene, then the one being typed. A speaker's lines carry their name. `children` (Continue) go under the text. Only the turn being typed is in an `aria-live` region (a finished turn is plain text, and a spoken line is announced by the Dock), so a screen reader says each line once (D31).
import { useEffect, useRef, type ReactNode } from 'react'
import { shortName } from '../names'
import { scrollKey, type ReadChunk, type Turn } from '../turns'
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
  const size = scrollKey(read, done.length, now !== undefined)
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
          <div className="narration" onClick={onSkip}>
            {done.map((t, i) => <Told key={i} turn={t} />)}
            <div aria-live="polite">{now !== undefined && <Lines lines={now.lines} revealed={revealed} />}</div>
          </div>
          {children}
        </div>
      </div>
    </section>
  )
}
