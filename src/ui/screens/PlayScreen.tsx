// ui/screens/PlayScreen.tsx — the game: vitals, honor, scene with typewriter, toasts, choices or Continue (UI_UX §3). Mood class tints the page; low HP / Reason add a vignette / flicker (§7).
import type { Hud, View } from '../../engine/select'
import type { ChoiceId } from '../../engine/types'
import { ChoiceList } from '../components/ChoiceList'
import { HonorMeter } from '../components/HonorMeter'
import { SceneView } from '../components/SceneView'
import { StatBar } from '../components/StatBar'
import { Toast } from '../components/Toast'
import { useKeys } from '../hooks/useKeys'
import { useTypewriter } from '../hooks/useTypewriter'
import { S } from '../strings'
import { isLowHp, isLowReason } from '../vitals'
interface Props {
  view: View
  hud: Hud
  step: number // scenes played so far: restarts the typewriter and the choice animation for each scene
  typewriter: boolean // false with reduced motion
  toasts: readonly string[]
  toastSeq: number
  saveError: string | undefined
  onChoose: (id: ChoiceId) => void
  onNext: () => void
  onMenu: () => void
  onSettings: () => void
}
const nothing = (): void => undefined
export function PlayScreen({ view, hud, step, typewriter, toasts, toastSeq, saveError, onChoose, onNext, onMenu, onSettings }: Props) {
  const tw = useTypewriter(view.lines, step, typewriter)
  // While the text is still typing, a tap or key finishes it first, so a double tap cannot run past a scene unread.
  const choose = (id: ChoiceId): void => (tw.done ? onChoose(id) : tw.skip())
  const next = (): void => (tw.done ? onNext() : tw.skip())
  useKeys(
    { kind: view.kind, choices: view.choices, typing: !tw.done },
    { pick: (i) => { const c = view.choices[i]; if (c !== undefined) choose(c.id) }, skip: tw.skip, next, journal: nothing }, // Journal: M3
  )
  const mood = ['play', `mood-${view.mood ?? 'calm'}`, isLowReason(hud.stats) ? 'lowreason' : ''].join(' ').trim()
  return (
    <>
      <div className={mood}>
        <StatBar hud={hud} />
        <HonorMeter honor={hud.honor} tier={hud.tier} />
        <SceneView view={view} revealed={tw.done ? undefined : tw.count} onSkip={tw.done ? undefined : tw.skip} />
        <Toast lines={toasts} seq={toastSeq} />
        {saveError !== undefined && <p role="alert" className="notice">{S.saveFailed}</p>}
        <div className="actions" key={step}>
          {view.kind === 'choices' ? (
            <ChoiceList choices={view.choices} onPick={choose} />
          ) : (
            <button type="button" className="btn primary" onClick={next}>{S.continue}</button>
          )}
        </div>
        <div className="play-links">
          <button type="button" className="btn link" onClick={onMenu}>{S.menu}</button>
          <button type="button" className="btn link" onClick={onSettings}>{S.settings}</button>
        </div>
      </div>
      {isLowHp(hud.stats) && <div className="vignette" aria-hidden="true" />}
    </>
  )
}
