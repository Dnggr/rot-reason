// ui/components/SceneView.tsx — the stage pieces of a scene: backdrop, portrait (who), and the text box (place caption + narration + optional children). The full text is always in the DOM (UI_UX §9); `revealed` only makes the tail transparent (typewriter).
import type { ReactNode } from 'react'
import type { View } from '../../engine/select'
import { shortName } from '../names'
import { splitLines } from '../typewriter'
import { Backdrop } from './Backdrop'
interface Props {
  view: Pick<View, 'lines' | 'who' | 'place'>
  revealed?: number | undefined // characters shown so far; undefined = all
  onSkip?: (() => void) | undefined // tapping the narration finishes the typing
  children?: ReactNode // extra content inside the text box (the Continue button of a `next` scene)
}
export function SceneView({ view, revealed, onSkip, children }: Props) {
  const parts = revealed === undefined ? view.lines.map((l) => ({ shown: l, rest: '' })) : splitLines(view.lines, revealed)
  return (
    <section className="scene">
      <Backdrop name={view.place} />
      {view.who.length > 0 && (
        <div className="portrait" aria-hidden="true">
          {view.who.map((id) => (
            <span key={id} className="sil">{shortName(id)}</span>
          ))}
        </div>
      )}
      <div className="textbox">
        {view.place !== undefined && <span className="place">{view.place.replaceAll('_', ' ')}</span>}
        <div className="narration" aria-live="polite" onClick={onSkip}>
          {parts.map((p, i) => (
            <p key={i}>{p.shown}{p.rest !== '' && <span className="tw-rest">{p.rest}</span>}</p>
          ))}
        </div>
        {children}
      </div>
    </section>
  )
}
