// ui/screens/JournalScreen.tsx — the Journal (HONOR §7, UI_UX §2): Deeds (the last 20, seen or unseen, who reacted) and People (party cards first). It is drawn over the play screen, so the scene being read keeps its place.
import { useEffect, useState } from 'react'
import type { DeedView, JournalView } from '../../engine/journal'
import { CharacterCard } from '../components/CharacterCard'
import { shortName } from '../names'
import { S } from '../strings'
type Tab = 'deeds' | 'people'
const signed = (n: number): string => (n > 0 ? `+${n}` : `${n}`)
function Deed({ d }: { d: DeedView }) {
  const how = d.surfaced ? S.journal.cameOut : d.witnessed ? S.journal.seen : S.journal.unseen
  return (
    <li className="deed">
      <div className="deed-head">
        <strong>{shortName(d.tag)}</strong>
        <span className="chip">{how}</span>
        <span className="chip cost">{d.delta === 0 ? S.journal.noChange : S.journal.honor(d.delta)}</span>
        <span className="sub">{S.journal.day(d.day)}</span>
      </div>
      {d.who.length > 0 && <p className="sub">{S.journal.reacted} {d.who.map((w) => `${shortName(w.id)} ${signed(w.delta)}`).join(', ')}</p>}
    </li>
  )
}
export function JournalScreen({ journal, onBack }: { journal: JournalView; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('deeds')
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBack])
  const party = journal.people.filter((p) => p.inParty)
  const rest = journal.people.filter((p) => !p.inParty)
  const tabs: Tab[] = ['deeds', 'people']
  return (
    <div className="journal" role="dialog" aria-modal="true" aria-label={S.journal.title}>
      <div className="journal-box">
        <div className="journal-top">
          <h1>{S.journal.title}</h1>
          <button type="button" className="btn" autoFocus onClick={onBack}>{S.journal.close}</button>
        </div>
        <div className="seg" role="tablist" aria-label={S.journal.title}>
          {tabs.map((k) => (
            <button key={k} type="button" role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`} className="btn" onClick={() => setTab(k)}>{S.journal[k]}</button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="journal-body">
          {tab === 'deeds' && (journal.deeds.length === 0 ? <p className="muted">{S.journal.deedsEmpty}</p> : <ul className="deeds">{journal.deeds.map((d, i) => <Deed key={i} d={d} />)}</ul>)}
          {tab === 'people' && journal.people.length === 0 && <p className="muted">{S.journal.peopleEmpty}</p>}
          {tab === 'people' && party.length > 0 && <section aria-label={S.journal.party}><h2>{S.journal.party}</h2><ul className="people">{party.map((p) => <CharacterCard key={p.id} person={p} />)}</ul></section>}
          {tab === 'people' && rest.length > 0 && <section aria-label={S.journal.others}><h2>{S.journal.others}</h2><ul className="people">{rest.map((p) => <CharacterCard key={p.id} person={p} />)}</ul></section>}
        </div>
      </div>
    </div>
  )
}
