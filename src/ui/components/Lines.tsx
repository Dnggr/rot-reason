// ui/components/Lines.tsx — paragraphs of one text, typed so far: the whole text stays in the DOM, only the untyped tail is made transparent (UI_UX §7, §9)
import { splitLines } from '../typewriter'
export function Lines({ lines, revealed }: { lines: readonly string[]; revealed?: number | undefined }) {
  const parts = revealed === undefined ? lines.map((l) => ({ shown: l, rest: '' })) : splitLines(lines, revealed)
  return (
    <>
      {parts.map((p, i) => (
        <p key={i}>{p.shown}{p.rest !== '' && <span className="tw-rest">{p.rest}</span>}</p>
      ))}
    </>
  )
}
