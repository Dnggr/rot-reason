// debug/DebugPanel.tsx — the debug panel (?debug=1 or a dev build): state, log, controls, console handle, and Copy debug report with a note. Loaded lazily by main.tsx; nothing imports it.
import { useEffect, useRef, useState } from 'react'
import type { DebugApi } from '../ui/debugApi'
import { ReportButton } from '../ui/components/ReportButton'
import { Controls } from './Controls'
import './debug.css'
import { installHandle } from './rrHandle'
import { StateView } from './StateView'
export function DebugPanel(api: DebugApi) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const live = useRef(api.game)
  useEffect(() => {
    live.current = api.game
  })
  useEffect(() => installHandle(window, () => live.current, api.dispatch, api.story), [api.dispatch, api.story])
  return (
    <aside className="dbg" aria-label="Debug panel">
      <button type="button" className="dbg-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close debug' : 'Debug'}</button>
      {open && (
        <div className="dbg-body">
          <StateView game={api.game} />
          <Controls api={api} />
          <section className="dbg-sec" aria-label="Report">
            <label className="dbg-note">Note for the report<textarea value={note} rows={3} placeholder="What did you expect, what happened?" onChange={(e) => setNote(e.currentTarget.value)} /></label>
            <ReportButton report={() => api.report(note)} />
          </section>
        </div>
      )}
    </aside>
  )
}
