// ui/components/Dock.tsx — the bottom bar (UI_UX §3): the talking character's portrait, their line in a text box (children = Continue), and the Choices panel. Rendered only while someone talks or choices are offered.
import type { ReactNode } from 'react'
import { shortName } from '../names'
import { Lines } from './Lines'
interface Props {
  who: string | undefined // the speaker; undefined = nobody talks (only the panel shows)
  lines: readonly string[]
  revealed?: number | undefined // characters typed so far; undefined = all
  onSkip?: (() => void) | undefined
  panel?: ReactNode // the Choices panel
  children?: ReactNode // inside the text box, under the line
}
export function Dock({ who, lines, revealed, onSkip, panel, children }: Props) {
  return (
    <div className="dock">
      {who !== undefined && (
        <>
          <div className="portrait" aria-hidden="true">
            <span className="sil">{shortName(who)}</span>
          </div>
          <div className="textbox">
            <span className="place">{shortName(who)}</span>
            <div className="narration" aria-live="polite" onClick={onSkip}>
              <Lines lines={lines} revealed={revealed} />
            </div>
            {children}
          </div>
        </>
      )}
      {panel}
    </div>
  )
}
