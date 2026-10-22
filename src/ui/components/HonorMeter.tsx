// ui/components/HonorMeter.tsx — split honor bar (-100..+100 from the middle) with the tier word (HONOR §2, UI_UX §3)
import type { Tier } from '../../engine/types'
import { S } from '../strings'
export function HonorMeter({ honor, tier }: { honor: number; tier: Tier }) {
  const half = Math.min(100, Math.abs(honor)) / 2 // percent of the full bar, measured from the middle
  const style = honor < 0 ? { left: `${50 - half}%`, width: `${half}%` } : { left: '50%', width: `${half}%` }
  return (
    <div className="honor" role="meter" aria-label={S.honor} aria-valuemin={-100} aria-valuemax={100} aria-valuenow={honor} aria-valuetext={`${S.tier[tier]}, ${honor}`}>
      <div className="honor-bar" aria-hidden="true">
        <span className={honor < 0 ? 'honor-fill neg' : 'honor-fill pos'} style={style} />
        <span className="honor-mid" />
      </div>
      <span className="honor-label">{S.tier[tier]}</span>
    </div>
  )
}
