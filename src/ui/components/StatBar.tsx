// ui/components/StatBar.tsx — top bar: day and phase, HP pips, Reason (Rot once it is above 0), resource chips (UI_UX §3)
import { STAT_RANGE } from '../../engine/bounds'
import { RES_KEYS } from '../../engine/choices'
import type { Hud } from '../../engine/select'
import { S } from '../strings'
const HP_MAX = STAT_RANGE.hp[1]
export function StatBar({ hud }: { hud: Hud }) {
  const hp = hud.stats.hp
  return (
    <header className="statbar">
      <div className="statbar-row">
        <span className="daybadge">{S.dayPhase(hud.day, hud.phase)}</span>
        <span className="pips" role="img" aria-label={S.hpLabel(hp, HP_MAX)}>
          <span className="pip-label" aria-hidden="true">{S.stat.hp}</span>
          {Array.from({ length: HP_MAX }, (_, i) => (
            <span key={i} className={i < hp ? 'pip on' : 'pip'} aria-hidden="true" />
          ))}
        </span>
        <span className="vital reason">{S.stat.reason} {hud.stats.reason}</span>
        {hud.stats.rot > 0 && <span className="vital rot">{S.stat.rot} {hud.stats.rot}</span>}
      </div>
      <ul className="chips" aria-label="Resources">
        {RES_KEYS.map((k) => (
          <li key={k} className="chip res">{S.res[k]} {hud.res[k]}</li>
        ))}
      </ul>
    </header>
  )
}
