// ui/Game.tsx — picks the screen from useGame: title, background, play, ending, or the error fallback for a broken scene
import { useEffect, type RefObject } from 'react'
import type { GameState, Story } from '../engine/types'
import { ErrorFallback, type FallbackAction } from './components/ErrorFallback'
import { playRoute } from './hooks/gameModel'
import { useGame } from './hooks/useGame'
import { BackgroundScreen } from './screens/BackgroundScreen'
import { EndingScreen } from './screens/EndingScreen'
import { PlayScreen } from './screens/PlayScreen'
import { TitleScreen } from './screens/TitleScreen'
import type { Store } from './storage'
import { S } from './strings'
interface Props {
  story: Story
  persist: Store
  stateRef: RefObject<GameState | undefined>
}
export function Game({ story, persist, stateRef }: Props) {
  const g = useGame(story, persist)
  useEffect(() => {
    stateRef.current = g.game
  }, [g.game, stateRef])
  if (g.screen === 'title') return <TitleScreen saved={g.saved} persistent={g.persistent} onNew={g.openBackground} onContinue={g.resume} />
  if (g.screen === 'background') return <BackgroundScreen cards={g.cards} onBegin={g.start} onBack={g.toTitle} />
  const v = g.view
  const route = playRoute(v)
  if (route === 'fallback') {
    const actions: FallbackAction[] = [{ label: S.newGame, onClick: g.openBackground }, { label: S.toTitle, onClick: g.toTitle }]
    if (g.canRestartChapter) actions.unshift({ label: S.restartChapter, onClick: g.restartChapter })
    return <ErrorFallback title={S.errorTitle} lines={v.lines.length > 0 ? v.lines : [S.errorMissing]} report={g.report} actions={actions} />
  }
  if (route === 'ending') return <EndingScreen view={v} hud={g.hud} onNew={g.openBackground} onTitle={g.toTitle} />
  return <PlayScreen view={v} hud={g.hud} toasts={g.toasts} toastSeq={g.toastSeq} saveError={g.saveError} onChoose={g.choose} onNext={g.next} onMenu={g.toTitle} />
}
