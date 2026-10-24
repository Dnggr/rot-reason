// ui/components/SceneView.tsx — art placeholder (place + silhouettes) and the narration. The full text is always in the DOM (UI_UX §9); `revealed` only makes the tail transparent (typewriter).
import type { View } from '../../engine/select'
import { shortName } from '../names'
import { splitLines } from '../typewriter'
interface Props {
  view: Pick<View, 'lines' | 'who' | 'place'>
  revealed?: number | undefined // characters shown so far; undefined = all
  onSkip?: (() => void) | undefined // tapping the narration finishes the typing
}
export function SceneView({ view, revealed, onSkip }: Props) {
  const parts = revealed === undefined ? view.lines.map((l) => ({ shown: l, rest: '' })) : splitLines(view.lines, revealed)
  return (
    <section className="scene">
      <div className="art" aria-hidden="true">
        {view.place !== undefined && <span className="place">{view.place.replaceAll('_', ' ')}</span>}
        <div className="who">
          {view.who.map((id) => (
            <span key={id} className="sil">{shortName(id)}</span>
          ))}
        </div>
      </div>
      <div className="narration" aria-live="polite" onClick={onSkip}>
        {parts.map((p, i) => (
          <p key={i}>{p.shown}{p.rest !== '' && <span className="tw-rest">{p.rest}</span>}</p>
        ))}
      </div>
    </section>
  )
}
