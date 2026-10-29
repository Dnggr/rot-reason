// story/approval.ts — companion approval of deeds (HONOR.md §5) as trust changes, plus when a companion walks out (CHARACTERS.md relationship thresholds). The only place to balance it.
import type { ApprovalTable, Social } from '../engine/types'
const STEP = 5 // trust per `+`: `++` is 10, `-` is -5, `--` is -10
const COMPANIONS = ['nora', 'brick', 'juno', 'hart', 'calloway'] as const
const MARKS: Readonly<Record<string, number>> = { '++': 2, '+': 1, '0': 0, '-': -1, '--': -2 }
// One row per deed tag, one mark per companion, in COMPANIONS order: the HONOR.md §5 table. Tags not listed (keep_word, lie_harm, betray, torture, murder, cruelty_show) move nobody yet.
const ROWS: Readonly<Record<string, string>> = {
  mercy: '++ 0 + + -',
  share: '+ + 0 + -',
  protect: '+ ++ + 0 0',
  honest: '+ + ++ 0 -',
  lie: '- - -- - +',
  steal: '- 0 0 -- +',
  intimidate: '- + - - +',
  kill_surrender: '-- - - -- 0',
  abandon: '- -- - - +',
  sacrifice: '+ + + ++ 0',
}
function build(): ApprovalTable {
  const out: Record<string, Record<string, number>> = Object.fromEntries(COMPANIONS.map((id) => [id, {}]))
  for (const [tag, row] of Object.entries(ROWS)) {
    row.split(' ').forEach((mark, i) => {
      const id = COMPANIONS[i]
      const n = (MARKS[mark] ?? 0) * STEP
      const col = id === undefined ? undefined : out[id]
      if (col !== undefined && n !== 0) col[tag] = n
    })
  }
  return out
}
export const APPROVAL: ApprovalTable = build()
// trust <= -30 is the conflict line (CHARACTERS.md); fear >= 60 is compliance (it keeps a companion who no longer trusts you).
export const SOCIAL: Social = { approval: APPROVAL, leaveTrust: -30, fearHolds: 60 }