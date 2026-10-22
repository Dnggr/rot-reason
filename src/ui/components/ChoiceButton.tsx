// ui/components/ChoiceButton.tsx — one choice: tone chip, text, cost chips, odds word, lock reason (UI_UX §5). Disabled via aria-disabled so the reason stays readable.
import { RES_KEYS } from '../../engine/choices'
import type { ChoiceView } from '../../engine/select'
import type { ChoiceId } from '../../engine/types'
import { describeLock } from '../lockReason'
import { S } from '../strings'
interface Props {
  choice: ChoiceView
  onPick: (id: ChoiceId) => void
}
export function ChoiceButton({ choice, onPick }: Props) {
  const costs = RES_KEYS.flatMap((k) => {
    const n = choice.cost?.[k] ?? 0
    return n > 0 ? [`-${n} ${S.res[k]}`] : []
  })
  const why = choice.why === 'lock' ? (choice.lock === undefined ? S.lock.generic : describeLock(choice.lock)) : choice.why === 'cost' ? S.cantAfford : undefined
  return (
    <button type="button" className={`choice tone-${choice.tone ?? 'none'}`} aria-disabled={!choice.enabled} onClick={() => choice.enabled && onPick(choice.id)}>
      {choice.tone !== undefined && <span className="chip tone">{S.tone[choice.tone]}</span>}
      <span className="choice-text">{choice.text}</span>
      <span className="choice-chips">
        {costs.map((c) => (
          <span key={c} className="chip cost">{c}</span>
        ))}
        {choice.odds !== undefined && <span className="chip odds">{S.odds[choice.odds]}</span>}
        {why !== undefined && <span className="chip lock">{choice.why === 'lock' ? '🔒 ' : ''}{why}</span>}
      </span>
    </button>
  )
}
