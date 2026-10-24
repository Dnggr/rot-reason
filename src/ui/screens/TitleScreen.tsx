// ui/screens/TitleScreen.tsx — full-screen backdrop, title and the buttons stacked on the left: Continue (day, chapter, honor tier) / New game / Settings; a second tap confirms erasing an existing save
import { useState } from 'react'
import { Backdrop } from '../components/Backdrop'
import type { Saved } from '../hooks/gameModel'
import { S } from '../strings'
interface Props {
  saved: Saved
  persistent: boolean
  onNew: () => void
  onContinue: () => void
  onSettings: () => void
}
export function TitleScreen({ saved, persistent, onNew, onContinue, onSettings }: Props) {
  const [confirm, setConfirm] = useState(false)
  const hasSave = saved.kind === 'ok'
  const newGame = (): void => (hasSave && !confirm ? setConfirm(true) : onNew())
  return (
    <main className="stage title">
      <Backdrop name="title" />
      <div className="title-menu">
        <h1>{S.title}</h1>
        <p className="tagline">{S.tagline}</p>
        {saved.kind === 'ok' && (
          <button type="button" className="btn primary" onClick={onContinue}>
            {S.continue}
            <span className="sub">{saved.hud.name} · {S.dayPhase(saved.hud.day, saved.hud.phase)} · {S.chapter(saved.chapter)} · {S.tier[saved.hud.tier]}</span>
            {saved.via !== 'snapshot' && <span className="sub">{S.recovered}</span>}
          </button>
        )}
        <button type="button" className={hasSave ? 'btn' : 'btn primary'} onClick={newGame}>{confirm ? S.eraseAndStart : S.newGame}</button>
        <button type="button" className="btn" onClick={onSettings}>{S.settings}</button>
        {saved.kind === 'broken' && <p role="alert" className="notice">{S.saveBroken}</p>}
        {!persistent && <p role="alert" className="notice">{S.noStorage}</p>}
      </div>
    </main>
  )
}
