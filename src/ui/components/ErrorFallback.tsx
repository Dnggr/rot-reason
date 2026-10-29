// ui/components/ErrorFallback.tsx — the visible fallback for anything that broke: message, Copy debug report, recovery actions (ARCHITECTURE §5.4)
import { ConfirmButton } from './ConfirmButton'
import { ReportButton } from './ReportButton'
export interface FallbackAction {
  label: string
  onClick: () => void
  confirm?: string // set when the action replaces the saved game: the button asks for a second tap and says this after the first (D31)
}
interface Props {
  title: string
  lines: readonly string[]
  report: () => string
  actions: readonly FallbackAction[]
}
export function ErrorFallback({ title, lines, report, actions }: Props) {
  return (
    <main className="shell error" role="alert">
      <h1>{title}</h1>
      {lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
      <ReportButton report={report} />
      {actions.map((a) => (a.confirm === undefined
        ? <button key={a.label} type="button" className="btn" onClick={a.onClick}>{a.label}</button>
        : <ConfirmButton key={a.label} className="btn" label={a.label} confirm={a.confirm} onConfirm={a.onClick} />))}
    </main>
  )
}