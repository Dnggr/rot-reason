// ui/screens/PlayScreen.tsx — the stage (UI_UX §3): HUD top-left, Menu / Journal / Settings top-right, the story in the middle, and a bottom dock (portrait, spoken line, Choices) only while a character talks or choices are offered. The scene is read turn by turn; mood tints the page; low HP / Reason add a vignette / flicker (§7). The Journal and the tier banner are drawn over it; while one is open the page behind is inert and its keys are off.
import type { JournalView } from '../../engine/journal'
import type { Hud, View } from '../../engine/select'
import type { ChoiceId } from '../../engine/types'
import { ChoiceList } from '../components/ChoiceList'
import { Dock } from '../components/Dock'
import { HonorMeter } from '../components/HonorMeter'
import { SceneView } from '../components/SceneView'
import { StatBar } from '../components/StatBar'
import { TierBanner } from '../components/TierBanner'
import { Toast } from '../components/Toast'
import { useKeys } from '../hooks/useKeys'
import { useTurn } from '../hooks/useTurn'
import { useTypewriter } from '../hooks/useTypewriter'
import { JournalScreen } from './JournalScreen'
import { S } from '../strings'
import type { Banner } from '../tiers'
import { turnsOf, type ReadChunk } from '../turns'
import { isLowHp, isLowReason } from '../vitals'
interface Props {
  view: View
  hud: Hud
  step: number // scenes played so far: restarts the typewriter and the choice animation for each scene
  typewriter: boolean // false with reduced motion
  toasts: readonly string[]
  toastSeq: number
  read?: readonly ReadChunk[] // scenes already read, kept above this one (web-novel page)
  saveError: string | undefined
  onChoose: (id: ChoiceId) => void
  onNext: () => void
  onMenu: () => void
  onSettings: () => void
  journal?: JournalView | undefined // set while the Journal is open (drawn over this screen)
  banner?: Banner | undefined // a tier change, shown once
  onJournal?: () => void
  onJournalClose?: () => void
  onBanner?: () => void
}
const nothing = (): void => undefined
export function PlayScreen({ view, hud, step, typewriter, toasts, toastSeq, read = [], saveError, onChoose, onNext, onMenu, onSettings, journal, banner, onJournal = nothing, onJournalClose = nothing, onBanner = nothing }: Props) {
  const turns = turnsOf(view.beats)
  const t = useTurn(step, turns.length)
  const now = turns[t.turn]
  const speaker = now?.who
  const tw = useTypewriter(now?.lines ?? [], `${step}.${t.turn}`, typewriter)
  const asking = t.last && view.kind === 'choices' // the choices show on the last turn only
  // While the text is still typing, a tap or key finishes it first, so a double tap cannot run past a turn unread.
  const choose = (id: ChoiceId): void => (tw.done ? onChoose(id) : tw.skip())
  const next = (): void => (!tw.done ? tw.skip() : t.last ? onNext() : t.advance())
  const over = journal !== undefined || banner !== undefined // an overlay is up: the page behind takes no keys
  useKeys(
    over ? { kind: 'end', choices: [], typing: false } : { kind: t.last ? view.kind : 'next', choices: t.last ? view.choices : [], typing: !tw.done },
    { pick: (i) => { const c = view.choices[i]; if (c !== undefined) choose(c.id) }, skip: tw.skip, next, journal: journal !== undefined ? onJournalClose : banner === undefined ? onJournal : nothing },
  )
  const mood = ['play', `mood-${view.mood ?? 'calm'}`, isLowReason(hud.stats) ? 'lowreason' : ''].join(' ').trim()
  const revealed = tw.done ? undefined : tw.count
  const onSkip = tw.done ? undefined : tw.skip
  const goOn = asking ? undefined : (
    <div className="actions" key={`${step}.${t.turn}`}>
      <button type="button" className="btn primary" onClick={next}>{S.continue}</button>
    </div>
  )
  const panel = asking ? (
    <aside className="panel" aria-label={S.choicesTitle}>
      <h2>{S.choicesTitle}</h2>
      <div className="actions" key={step}>
        <ChoiceList choices={view.choices} onPick={choose} />
      </div>
    </aside>
  ) : undefined
  return (
    <>
      <div className={mood} inert={over}>
        <div className="hud">
          <StatBar hud={hud} />
          <HonorMeter honor={hud.honor} tier={hud.tier} />
        </div>
        <SceneView place={view.place} read={read} done={turns.slice(0, t.turn)} now={speaker === undefined ? now : undefined} revealed={revealed} onSkip={onSkip}>
          {speaker === undefined && goOn}
        </SceneView>
        <Toast lines={toasts} seq={toastSeq} />
        {saveError !== undefined && <p role="alert" className="notice">{S.saveFailed}</p>}
        {(speaker !== undefined || asking) && (
          <Dock who={speaker} lines={now?.lines ?? []} revealed={revealed} onSkip={onSkip} panel={panel}>
            {goOn}
          </Dock>
        )}
        <div className="play-links">
          <button type="button" className="btn link" onClick={onMenu}>{S.menu}</button>
          <button type="button" className="btn link" onClick={onJournal}>{S.journal.open}</button>
          <button type="button" className="btn link" onClick={onSettings}>{S.settings}</button>
        </div>
      </div>
      {isLowHp(hud.stats) && <div className="vignette" aria-hidden="true" />}
      {journal !== undefined && <JournalScreen journal={journal} onBack={onJournalClose} />}
      {banner !== undefined && journal === undefined && <TierBanner banner={banner} onDismiss={onBanner} />}
    </>
  )
}
