// ui/components/ErrorBoundary.tsx — catches render errors anywhere below it: "Something broke" + Copy debug report (ARCHITECTURE §5.5)
import { Component, type ErrorInfo, type ReactNode, type RefObject } from 'react'
import { buildReport, reportText } from '../../engine/report'
import type { GameState } from '../../engine/types'
import { S } from '../strings'
import { APP_VERSION } from '../version'
import { ErrorFallback } from './ErrorFallback'
interface Props {
  children: ReactNode
  stateRef: RefObject<GameState | undefined> // the last game state, so the report has it
}
interface State {
  error: Error | undefined
}
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: undefined }
  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }
  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('rot-reason: render error', error, info.componentStack)
  }
  override render(): ReactNode {
    const { error } = this.state
    if (error === undefined) return this.props.children
    const report = (): string => reportText(buildReport({ version: APP_VERSION, state: this.props.stateRef.current, note: undefined, error: error.stack ?? error.message }))
    return <ErrorFallback title={S.errorTitle} lines={[S.errorBody]} report={report} actions={[{ label: S.reload, onClick: () => window.location.reload() }]} />
  }
}