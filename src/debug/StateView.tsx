// debug/StateView.tsx — read-only view of the run: where we are, flags, secrets, party, echoes, the state tree and the last 30 log lines (ARCHITECTURE §7)
import { formatEntry } from '../engine/log'
import { REPORT_LOG_LINES } from '../engine/report'
import type { GameState } from '../engine/types'
const list = (xs: readonly string[]): string => (xs.length === 0 ? 'none' : [...xs].sort().join(', '))
export function StateView({ game }: { game: GameState }) {
  const { log, history, ...tree } = game // the log and history have their own lines below
  return (
    <section className="dbg-sec" aria-label="State">
      <p className="dbg-head">{game.scene} · chapter {game.chapter} · day {game.day} {game.phase}</p>
      <p>seed {game.seed} · rng {game.rng} · {history.length} steps · hp {game.stats.hp} reason {game.stats.reason} rot {game.stats.rot} · honor {game.honor}</p>
      <p>flags: {list(Object.keys(game.flags))}</p>
      <p>secrets: {list(game.secrets)} · party: {list(game.party)}</p>
      <p>echoes: {game.echoes.length === 0 ? 'none' : game.echoes.map((e) => `${e.scene}${e.dueIn === undefined ? '' : ` in ${e.dueIn}`}${e.atChapter === undefined ? '' : ` at ${e.atChapter}`}`).join(', ')}</p>
      <details>
        <summary>State tree</summary>
        <pre>{JSON.stringify(tree, null, 1)}</pre>
      </details>
      <details open>
        <summary>Log (last {REPORT_LOG_LINES})</summary>
        <pre>{log.slice(-REPORT_LOG_LINES).map(formatEntry).join('\n') || '(empty)'}</pre>
      </details>
    </section>
  )
}
