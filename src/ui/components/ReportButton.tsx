// ui/components/ReportButton.tsx — "Copy debug report": clipboard first; if it is blocked the text is shown to copy by hand (never a silent failure)
import { useState } from 'react'
import { S } from '../strings'
type Phase = 'idle' | 'copied' | 'manual'
export function ReportButton({ report }: { report: () => string }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [text, setText] = useState('')
  function copy(): void {
    const t = report()
    setText(t)
    try {
      navigator.clipboard.writeText(t).then(() => setPhase('copied'), () => setPhase('manual'))
    } catch {
      setPhase('manual') // no clipboard API (insecure context): the textarea below is the visible fallback
    }
  }
  return (
    <div className="report">
      <button type="button" className="btn" onClick={copy}>{phase === 'copied' ? S.copied : S.copyReport}</button>
      {phase === 'manual' && (
        <>
          <p className="muted">{S.copyByHand}</p>
          <textarea readOnly value={text} rows={8} onFocus={(e) => e.currentTarget.select()} />
        </>
      )}
    </div>
  )
}
