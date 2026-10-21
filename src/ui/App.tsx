// ui/App.tsx — root component (M0: placeholder screen only)
import { S } from './strings'

export function App() {
  return (
    <main className="shell">
      <h1>{S.title}</h1>
      <p className="tagline">{S.tagline}</p>
      <p>{S.hello}</p>
      <p className="muted">{S.status}</p>
    </main>
  )
}
