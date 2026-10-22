// ui/screens/PlayScreen.tsx — the game: vitals, honor, scene, toasts, choices or Continue (UI_UX §3). Mood class tints the page.
import type { Hud, View } from '../../engine/select'
import type { ChoiceId } from '../../engine/types'
import { ChoiceList } from '../components/ChoiceList'
import { HonorMeter } from '../components/HonorMeter'
import { SceneView } from '../components/SceneView'
import { StatBar } from '../components/StatBar'
import { Toast } from '../components/Toast'
import { S } from '../strings'
interface Props {
  view: View
  hud: Hud
  toasts: readonly string[]
  toastSeq: number
  saveError: string | undefined
  onChoose: (id: ChoiceId) => void
  onNext: () => void
  onMenu: () => void
}
export function PlayScreen({ view, hud, toasts, toastSeq, saveError, onChoose, onNext, onMenu }: Props) {
  return (
    <div className={`play mood-${view.mood ?? 'calm'}`}>
      <StatBar hud={hud} />
      <HonorMeter honor={hud.honor} tier={hud.tier} />
      <SceneView view={view} />
      <Toast lines={toasts} seq={toastSeq} />
      {saveError !== undefined && <p role="alert" className="notice">{S.saveFailed}</p>}
      {view.kind === 'choices' ? (
        <ChoiceList choices={view.choices} onPick={onChoose} />
      ) : (
        <button type="button" className="btn primary" onClick={onNext}>{S.continue}</button>
      )}
      <button type="button" className="btn link" onClick={onMenu}>{S.menu}</button>
    </div>
  )
}
