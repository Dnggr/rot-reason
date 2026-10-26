// ui/components/CharacterCard.tsx — one person in the Journal or at camp: name, status (with you / dead), trust and fear bars, and their perk (UI_UX §4)
import type { PersonView } from '../../engine/journal'
import { shortName } from '../names'
import { S } from '../strings'
// Trust (-100..100) grows from the middle like the honor meter; fear (0..100) grows from the left. Numbers are in the label, so colour is never the only signal.
function Bar({ label, value, kind }: { label: string; value: number; kind: 'trust' | 'fear' }) {
  const half = Math.abs(value) / 2
  const style = kind === 'fear' ? { left: '0%', width: `${value}%` } : value < 0 ? { left: `${50 - half}%`, width: `${half}%` } : { left: '50%', width: `${half}%` }
  return (
    <div className="meter-row">
      <span className="meter-name">{kind === 'trust' ? S.journal.trust : S.journal.fear} {value}</span>
      <div className="meter" role="meter" aria-label={label} aria-valuemin={kind === 'trust' ? -100 : 0} aria-valuemax={100} aria-valuenow={value}>
        <span className={kind === 'trust' && value < 0 ? 'meter-fill neg' : `meter-fill ${kind}`} style={style} />
        {kind === 'trust' && <span className="honor-mid" />}
      </div>
    </div>
  )
}
export function CharacterCard({ person }: { person: PersonView }) {
  const who = shortName(person.id)
  return (
    <li className={person.alive ? 'person' : 'person gone'}>
      <div className="person-head">
        <h3>{who}</h3>
        {person.inParty && <span className="chip tone">{S.journal.inParty}</span>}
        {!person.alive && <span className="chip lock">{S.journal.dead}</span>}
      </div>
      {person.name !== who && <p className="sub">{person.name}</p>}
      <Bar label={S.journal.trustLabel(who, person.trust)} value={person.trust} kind="trust" />
      <Bar label={S.journal.fearLabel(who, person.fear)} value={person.fear} kind="fear" />
      {person.perk !== undefined && <p className="perk"><strong>{S.journal.perk}.</strong> {person.perk}</p>}
    </li>
  )
}
