// ui/components/ErrorFallback.tsx — the visible fallback for anything that broke: message, Copy debug report, recovery actions (ARCHITECTURE §5.4)
import { ReportButton } from './ReportButton'
export interface FallbackAction {
  label: string
  onClick: () => void
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
      {actions.map((a) => (
        <button key={a.label} type="button" className="btn" onClick={a.onClick}>{a.label}</button>
      ))}
    </main>
  )
}
