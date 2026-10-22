// ui/components/ChoiceList.tsx — the choices, in the thumb zone (max 4)
import type { ChoiceView } from '../../engine/select'
import type { ChoiceId } from '../../engine/types'
import { ChoiceButton } from './ChoiceButton'
export function ChoiceList({ choices, onPick }: { choices: readonly ChoiceView[]; onPick: (id: ChoiceId) => void }) {
  return (
    <div className="choices">
      {choices.map((c) => (
        <ChoiceButton key={c.id} choice={c} onPick={onPick} />
      ))}
    </div>
  )
}
