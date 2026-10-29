// debug/Controls.tsx — jump to a scene, set a value or flag, advance the day, reseed the rolls, force a check, rewind (all through DEBUG_* actions; ARCHITECTURE §7)
import { useState } from 'react'
import { status } from '../engine/choices'
import { findScene } from '../engine/ids'
import type { DebugPatch } from '../engine/types'
import type { DebugApi } from '../ui/debugApi'
import { rollFor, type Want } from './forceRoll'
interface Field {
  id: string
  patch: (value: number) => DebugPatch
}
const FIELDS: readonly Field[] = [
  { id: 'hp', patch: (value) => ({ kind: 'stat', key: 'hp', value }) },
  { id: 'reason', patch: (value) => ({ kind: 'stat', key: 'reason', value }) },
  { id: 'rot', patch: (value) => ({ kind: 'stat', key: 'rot', value }) },
  { id: 'food', patch: (value) => ({ kind: 'res', key: 'food', value }) },
  { id: 'ammo', patch: (value) => ({ kind: 'res', key: 'ammo', value }) },
  { id: 'meds', patch: (value) => ({ kind: 'res', key: 'meds', value }) },
  { id: 'honor', patch: (value) => ({ kind: 'honor', value }) },
  { id: 'day', patch: (value) => ({ kind: 'day', value }) },
  { id: 'rng seed', patch: (value) => ({ kind: 'rng', value }) },
]
export function Controls({ api }: { api: DebugApi }) {
  const { game, story, playing, dispatch } = api
  const [scene, setScene] = useState('')
  const [field, setField] = useState('hp')
  const [value, setValue] = useState('')
  const [flag, setFlag] = useState('')
  const off = !playing
  const checks = (findScene(story, game.scene)?.choices ?? []).filter((c) => c.check !== undefined)
  const setNumber = (): void => {
    const f = FIELDS.find((x) => x.id === field)
    if (f !== undefined) dispatch({ type: 'DEBUG_SET', patch: f.patch(value.trim() === '' ? Number.NaN : Number(value)) }) // an empty box is refused by the engine, not read as 0
  }
  return (
    <section className="dbg-sec" aria-label="Controls">
      {off && <p className="dbg-off">Start a game to use the controls.</p>}
      <div className="dbg-row">
        <input list="dbg-scenes" value={scene} placeholder="scene id" aria-label="Scene id" onChange={(e) => setScene(e.currentTarget.value)} />
        <datalist id="dbg-scenes">{Object.keys(story.scenes).sort().map((id) => <option key={id} value={id} />)}</datalist>
        <button type="button" className="btn" disabled={off} onClick={() => dispatch({ type: 'DEBUG_JUMP', scene: scene.trim() })}>Jump</button>
      </div>
      <div className="dbg-row">
        <select value={field} aria-label="Value to set" onChange={(e) => setField(e.currentTarget.value)}>{FIELDS.map((f) => <option key={f.id}>{f.id}</option>)}</select>
        <input type="number" value={value} placeholder="value" aria-label="New value" onChange={(e) => setValue(e.currentTarget.value)} />
        <button type="button" className="btn" disabled={off} onClick={setNumber}>Set</button>
        <button type="button" className="btn" disabled={off} onClick={() => dispatch({ type: 'DEBUG_SET', patch: { kind: 'day', value: game.day + 1 } })}>Day +1</button>
      </div>
      <div className="dbg-row">
        <input value={flag} placeholder="flag name" aria-label="Flag name" onChange={(e) => setFlag(e.currentTarget.value)} />
        <button type="button" className="btn" disabled={off} onClick={() => dispatch({ type: 'DEBUG_SET', patch: { kind: 'flag', key: flag, on: true } })}>Set flag</button>
        <button type="button" className="btn" disabled={off} onClick={() => dispatch({ type: 'DEBUG_SET', patch: { kind: 'flag', key: flag, on: false } })}>Clear</button>
      </div>
      {checks.map((c) =>
        (['pass', 'fail'] as const).map((want: Want) => {
          const roll = c.check === undefined ? undefined : rollFor(want, c.check, game, story.traitBonus, story.perks)
          const blocked = off || roll === undefined || status(c, game) !== 'open'
          return (
            <button key={`${c.id}-${want}`} type="button" className="btn" disabled={blocked} onClick={() => {
              if (roll === undefined) return
              dispatch({ type: 'DEBUG_ROLL', roll })
              dispatch({ type: 'CHOOSE', choice: c.id }) // the forced roll is spent by this pick
            }}>
              Force {want}: pick {c.id}{roll === undefined ? ' (impossible)' : ` (d6 ${roll})`}
            </button>
          )
        }),
      )}
      <button type="button" className="btn" disabled={off || game.history.length === 0} onClick={() => dispatch({ type: 'DEBUG_REWIND' })}>Rewind last step</button>
    </section>
  )
}