// ui/App.tsx — root: error boundary, story loading, then <Game /> (with the debug panel when main.tsx passes one)
import { useMemo, useRef } from 'react'
import { buildReport, reportText } from '../engine/report'
import type { GameState } from '../engine/types'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ErrorFallback } from './components/ErrorFallback'
import type { DebugPanelComponent } from './debugApi'
import { Game } from './Game'
import { useStory } from './hooks/useStory'
import { openStore } from './storage'
import { S } from './strings'
import { APP_VERSION } from './version'
export function App({ debugPanel }: { debugPanel?: DebugPanelComponent | undefined }) {
  const stateRef = useRef<GameState | undefined>(undefined)
  const persist = useMemo(() => openStore(), [])
  const load = useStory()
  return (
    <ErrorBoundary stateRef={stateRef}>
      {load.status === 'loading' && <main className="shell"><p className="muted">{S.loading}</p></main>}
      {load.status === 'failed' && (
        <ErrorFallback
          title={S.storyFailed}
          lines={[load.error]}
          report={() => reportText(buildReport({ version: APP_VERSION, state: undefined, note: undefined, error: load.error }))}
          actions={[{ label: S.reload, onClick: () => window.location.reload() }]}
        />
      )}
      {load.status === 'ready' && <Game story={load.story} persist={persist} stateRef={stateRef} debugPanel={debugPanel} />}
    </ErrorBoundary>
  )
}