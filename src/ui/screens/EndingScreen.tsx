// ui/screens/EndingScreen.tsx — epilogue: ending title, the scene's text, a short recap, Restart chapter (the death ending only, D32) / New game (a second tap confirms: the finished run is the save, D31) / Title (UI_UX §2; companion cards and Share come later)
import type { Hud, View } from '../../engine/select'
import { ConfirmButton } from '../components/ConfirmButton'
import { SceneView } from '../components/SceneView'
import { S } from '../strings'
interface Props {
  view: View
  hud: Hud
  onRestart?: (() => void) | undefined // set on the death ending while a checkpoint exists
  onNew: () => void
  onTitle: () => void
}
export function EndingScreen({ view, hud, onRestart, onNew, onTitle }: Props) {
  return (
    <main className={`shell ending mood-${view.mood ?? 'calm'}`}>
      <p className="muted">{S.theEnd}</p>
      <h1>{S.ending(view.ending ?? '')}</h1>
      <SceneView place={undefined} now={{ who: undefined, lines: view.lines }} />
      <section aria-label={S.recap}>
        <h2>{S.recap}</h2>
        <dl className="recap">
          <dt>{S.day}</dt><dd>{hud.day}</dd>
          <dt>{S.honor}</dt><dd>{S.tier[hud.tier]} ({hud.honor})</dd>
          <dt>{S.stat.hp}</dt><dd>{hud.stats.hp}</dd>
          <dt>{S.stat.reason}</dt><dd>{hud.stats.reason}</dd>
        </dl>
      </section>
      {onRestart !== undefined && <button type="button" className="btn primary" onClick={onRestart}>{S.restartChapter}</button>}
      <ConfirmButton className={onRestart === undefined ? 'btn primary' : 'btn'} label={S.newGame} confirm={S.eraseAndStart} onConfirm={onNew} />
      <button type="button" className="btn" onClick={onTitle}>{S.toTitle}</button>
    </main>
  )
}
