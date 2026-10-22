// ui/screens/EndingScreen.tsx — epilogue: ending title, the scene's text, a short recap, New game / Title (UI_UX §2; companion cards and Share come later)
import type { Hud, View } from '../../engine/select'
import { SceneView } from '../components/SceneView'
import { S } from '../strings'
interface Props {
  view: View
  hud: Hud
  onNew: () => void
  onTitle: () => void
}
export function EndingScreen({ view, hud, onNew, onTitle }: Props) {
  return (
    <main className={`shell ending mood-${view.mood ?? 'calm'}`}>
      <p className="muted">{S.theEnd}</p>
      <h1>{S.ending(view.ending ?? '')}</h1>
      <SceneView view={{ lines: view.lines, who: [], place: undefined }} />
      <section aria-label={S.recap}>
        <h2>{S.recap}</h2>
        <dl className="recap">
          <dt>{S.day}</dt><dd>{hud.day}</dd>
          <dt>{S.honor}</dt><dd>{S.tier[hud.tier]} ({hud.honor})</dd>
          <dt>{S.stat.hp}</dt><dd>{hud.stats.hp}</dd>
          <dt>{S.stat.reason}</dt><dd>{hud.stats.reason}</dd>
        </dl>
      </section>
      <button type="button" className="btn primary" onClick={onNew}>{S.newGame}</button>
      <button type="button" className="btn" onClick={onTitle}>{S.toTitle}</button>
    </main>
  )
}
