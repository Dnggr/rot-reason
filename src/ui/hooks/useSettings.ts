// ui/hooks/useSettings.ts — the player's settings: read once (first run follows the device's reduced-motion preference), saved on every change, applied to <html> (UI_UX §9)
import { useEffect, useState } from 'react'
import type { KeyValueStore } from '../../engine/save'
import { applySettings, readSettings, writeSettings, type Settings } from '../settings'
export interface SettingsApi {
  settings: Settings
  damaged: boolean
  saveError: string | undefined
  update<K extends keyof Settings>(key: K, value: Settings[K]): void
}
const systemReduced = (): boolean => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches // no window: server render or tests
export function useSettings(store: KeyValueStore): SettingsApi {
  const [loaded] = useState(() => readSettings(store, systemReduced()))
  const [settings, setSettings] = useState<Settings>(loaded.settings)
  const [saveError, setSaveError] = useState<string | undefined>(undefined)
  useEffect(() => {
    applySettings(document.documentElement, settings)
  }, [settings])
  return {
    settings, damaged: loaded.damaged, saveError,
    update: (key, value) => {
      const next: Settings = { ...settings, [key]: value }
      setSettings(next)
      setSaveError(writeSettings(store, next))
    },
  }
}