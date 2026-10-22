// ui/components/SceneView.tsx — art placeholder (place + silhouettes) and the narration; full text is in the DOM at once, announced politely (UI_UX §9)
import type { View } from '../../engine/select'
import { shortName } from '../names'
export function SceneView({ view }: { view: Pick<View, 'lines' | 'who' | 'place'> }) {
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
      <div className="narration" aria-live="polite">
        {view.lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </section>
  )
}
