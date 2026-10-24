// ui/screens/SettingsScreen.tsx — comfort settings (UI_UX §2, §9): text size, soften violence, reduced motion, high contrast, sound, reset saved game. Changes apply at once.
import { useState } from 'react'
import { TEXT_SIZES, type Settings } from '../settings'
import { S } from '../strings'
interface Props {
  settings: Settings
  damaged: boolean // stored settings could not be read
  saveError: string | undefined // the last write failed
  canReset: boolean // opened from the title screen: erasing the save is meaningful there
  hasSave: boolean
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  onReset: () => void
  onBack: () => void
}
const TOGGLES = ['soften', 'reducedMotion', 'highContrast', 'sound'] as const
export function SettingsScreen({ settings, damaged, saveError, canReset, hasSave, onChange, onReset, onBack }: Props) {
  const [confirm, setConfirm] = useState(false)
  const reset = (): void => {
    if (!confirm) return setConfirm(true)
    setConfirm(false)
    onReset()
  }
  return (
    <main className="shell settings">
      <h1>{S.settings}</h1>
      {damaged && <p role="alert" className="notice">{S.settingsDamaged}</p>}
      {saveError !== undefined && <p role="alert" className="notice">{S.settingsNotSaved}</p>}
      <section aria-labelledby="set-size">
        <h2 id="set-size">{S.textSize}</h2>
        <div className="seg" role="radiogroup" aria-labelledby="set-size">
          {TEXT_SIZES.map((t) => (
            <button key={t} type="button" role="radio" aria-checked={settings.textSize === t} aria-label={S.sizes[t]} className="btn" onClick={() => onChange('textSize', t)}>{t}</button>
          ))}
        </div>
        <p className="muted">{S.sizes[settings.textSize]}</p>
      </section>
      {TOGGLES.map((k) => (
        <label key={k} className="toggle">
          <input type="checkbox" checked={settings[k]} onChange={(e) => onChange(k, e.currentTarget.checked)} />
          <span>{S.toggles[k].label}<span className="sub">{S.toggles[k].hint}</span></span>
        </label>
      ))}
      <section>
        <h2>{S.resetSave}</h2>
        {!canReset ? <p className="muted">{S.resetFromTitle}</p> : !hasSave ? <p className="muted">{S.noSaveToErase}</p> : (
          <button type="button" className="btn" onClick={reset}>{confirm ? S.eraseSave : S.resetSave}</button>
        )}
      </section>
      <button type="button" className="btn primary" onClick={onBack}>{S.back}</button>
    </main>
  )
}
