// ui/components/SceneView.tsx — the middle of the stage (UI_UX §3): backdrop plus the story text. Narration and, once a character has talked, their lines stay here in order; `children` (Continue) go under the text.
import type { ReactNode } from 'react'
import { shortName } from '../names'
import type { Turn } from '../turns'
import { Backdrop } from './Backdrop'
import { Lines } from './Lines'
interface Props {
  place: string | undefined
  done?: readonly Turn[] // turns already read: narration, and speech with the speaker's name
  now?: Turn | undefined // the turn being read, shown here only when it is narration (a speech turn is in the Dock)
  revealed?: number | undefined // characters of `now` shown so far; undefined = all
  onSkip?: (() => void) | undefined // tapping the text finishes the typing
  children?: ReactNode
}
export function SceneView({ place, done = [], now, revealed, onSkip, children }: Props) {
  return (
    <section className="scene">
      <Backdrop name={place} />
      <div className="story">
        {place !== undefined && <span className="place">{place.replaceAll('_', ' ')}</span>}
        <div className="narration" aria-live="polite" onClick={onSkip}>
          {done.map((t, i) =>
            t.who === undefined ? (
              <Lines key={i} lines={t.lines} />
            ) : (
              <div key={i} className="said">
                <span className="by">{shortName(t.who)}</span>
                <Lines lines={t.lines} />
              </div>
            ),
          )}
          {now !== undefined && <Lines lines={now.lines} revealed={revealed} />}
        </div>
        {children}
      </div>
    </section>
  )
}
