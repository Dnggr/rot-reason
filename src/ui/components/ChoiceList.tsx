// ui/components/ChoiceList.tsx — the choices, in the thumb zone (max 4), numbered for the 1-4 keys
import type { ChoiceView } from '../../engine/select'
import type { ChoiceId } from '../../engine/types'
import { ChoiceButton } from './ChoiceButton'
export function ChoiceList({ choices, onPick }: { choices: readonly ChoiceView[]; onPick: (id: ChoiceId) => void }) {
  return (
    <div className="choices">
      {choices.map((c, i) => (
        <ChoiceButton key={c.id} choice={c} hotkey={i + 1} onPick={onPick} />
      ))}
    </div>
  )
}
