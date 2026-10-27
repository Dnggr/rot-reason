// ui/screens/BackgroundScreen.tsx — pick a name and one of the backgrounds (attributes, trait, kit, one-line hook)
import { useState } from 'react'
import { NAME_MAX } from '../../engine/bounds'
import { RES_KEYS } from '../../engine/choices'
import type { BackgroundCard } from '../hooks/gameModel'
import { S } from '../strings'
interface Props {
  cards: readonly BackgroundCard[]
  onBegin: (bg: string, name: string) => void
  onBack: () => void
}
const kitOf = (c: BackgroundCard): string => RES_KEYS.flatMap((k) => (c.res[k] > 0 ? [`${c.res[k]} ${S.res[k]}`] : [])).join(', ') || S.kitEmpty
export function BackgroundScreen({ cards, onBegin, onBack }: Props) {
  const [name, setName] = useState('')
  const [pick, setPick] = useState<string | undefined>(undefined)
  return (
    <main className="shell">
      <h1>{S.chooseBackground}</h1>
      <label className="field">
        <span>{S.nameLabel}</span>
        <input value={name} maxLength={NAME_MAX} placeholder={S.defaultName} onChange={(e) => setName(e.target.value)} />
      </label>
      <div role="radiogroup" aria-label={S.chooseBackground} className="cards">
        {cards.map((c) => (
          <button key={c.key} type="button" role="radio" aria-checked={pick === c.key} className="card" onClick={() => setPick(c.key)}>
            <strong>{c.name}</strong>
            <span className="sub">{S.attr.grit} {c.attr.grit} · {S.attr.wits} {c.attr.wits} · {S.attr.heart} {c.attr.heart}</span>
            <span className="sub">{S.trait}: {c.trait} · {S.kit}: {kitOf(c)}</span>
            {c.hook !== undefined && <span className="hook">{c.hook}</span>}
          </button>
        ))}
      </div>
      <button type="button" className="btn primary" disabled={pick === undefined} onClick={() => pick !== undefined && onBegin(pick, name)}>{S.begin}</button>
      <button type="button" className="btn" onClick={onBack}>{S.back}</button>
    </main>
  )
}
