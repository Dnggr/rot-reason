// ui/Game.tsx — picks the screen from useGame: title, background, settings, play, ending, or the error fallback; mounts the debug panel when main.tsx gave one
import { useEffect, type RefObject } from 'react'
import type { GameState, Story } from '../engine/types'
import { ErrorFallback } from './components/ErrorFallback'
import type { DebugPanelComponent } from './debugApi'
import { canRetry, fallbackActions } from './fallback'
import { playRoute } from './hooks/gameModel'
import { useGame, type GameApi } from './hooks/useGame'
import { useSettings, type SettingsApi } from './hooks/useSettings'
import { BackgroundScreen } from './screens/BackgroundScreen'
import { EndingScreen } from './screens/EndingScreen'
import { PlayScreen } from './screens/PlayScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { TitleScreen } from './screens/TitleScreen'
import type { Store } from './storage'
import { S } from './strings'
interface Props {
  story: Story
  persist: Store
  stateRef: RefObject<GameState | undefined>
  debugPanel?: DebugPanelComponent | undefined // only in dev or with ?debug=1
}
function Screen({ g, s }: { g: GameApi; s: SettingsApi }) {
  if (g.screen === 'title') return <TitleScreen saved={g.saved} persistent={g.persistent} onNew={g.openBackground} onContinue={g.resume} onSettings={g.openSettings} />
  if (g.screen === 'background') return <BackgroundScreen cards={g.cards} onBegin={g.start} onBack={g.toTitle} />
  if (g.screen === 'settings') {
    return <SettingsScreen settings={s.settings} damaged={s.damaged} saveError={s.saveError} canReset={g.from === 'title'} hasSave={g.saveExists} onChange={s.update} onReset={g.resetSave} onBack={g.back} />
  }
  const v = g.view
  const route = playRoute(v)
  if (route === 'fallback') {
    return <ErrorFallback title={S.errorTitle} lines={v.lines.length > 0 ? v.lines : [S.errorMissing]} report={g.report} actions={fallbackActions(g)} />
  }
  if (route === 'ending') return <EndingScreen view={v} hud={g.hud} onRestart={canRetry(v.ending, g.canRestartChapter) ? g.restartChapter : undefined} onNew={g.openBackground} onTitle={g.toTitle} />
  return (
    <PlayScreen view={v} hud={g.hud} step={g.step} typewriter={!s.settings.reducedMotion} toasts={g.toasts} toastSeq={g.toastSeq} read={g.read} saveError={g.saveError}
      onChoose={g.choose} onNext={g.next} onMenu={g.toTitle} onSettings={g.openSettings}
      journal={g.screen === 'journal' ? g.journal : undefined} banner={g.banner} onJournal={g.openJournal} onJournalClose={g.closeJournal} onBanner={g.dismissBanner} />
  )
}
export function Game({ story, persist, stateRef, debugPanel: Debug }: Props) {
  const g = useGame(story, persist, Debug !== undefined)
  const s = useSettings(persist.store)
  useEffect(() => {
    stateRef.current = g.game
  }, [g.game, stateRef])
  return (
    <>
      <Screen g={g} s={s} />
      {Debug !== undefined && <Debug game={g.game} story={story} playing={g.screen === 'play'} dispatch={g.dispatch} report={g.report} />}
    </>
  )
}
