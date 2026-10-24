// ui/settings.ts — player settings (UI_UX §9): type, defaults, storage under rr_settings_v1, and how they reach the page (data-text, hc / reduce-motion / soften classes)
import { z } from 'zod'
import type { KeyValueStore } from '../engine/save'
export const TEXT_SIZES = ['S', 'M', 'L', 'XL'] as const
export type TextSize = (typeof TEXT_SIZES)[number]
export interface Settings {
  textSize: TextSize
  soften: boolean // stored and put on <html> as `soften`; no scene has a softer variant yet (M7)
  reducedMotion: boolean // no typewriter, pulses or flicker
  highContrast: boolean
  sound: boolean // stored only: there is no audio yet (M7)
}
export const SETTINGS_KEY = 'rr_settings_v1'
export const defaultSettings = (systemReduced: boolean = false): Settings => ({ textSize: 'M', soften: false, reducedMotion: systemReduced, highContrast: false, sound: false })
const schema = z.strictObject({ textSize: z.enum(TEXT_SIZES), soften: z.boolean(), reducedMotion: z.boolean(), highContrast: z.boolean(), sound: z.boolean() })
export interface LoadedSettings {
  settings: Settings
  damaged: boolean // stored settings existed but could not be read: defaults are in use and the Settings screen says so
}
// The first run follows the device's reduced-motion preference; after that the stored value wins.
export function readSettings(store: KeyValueStore, systemReduced: boolean = false): LoadedSettings {
  const fallback = defaultSettings(systemReduced)
  const raw = store.getItem(SETTINGS_KEY)
  if (raw === null) return { settings: fallback, damaged: false }
  try {
    const r = schema.safeParse(JSON.parse(raw))
    return r.success ? { settings: r.data, damaged: false } : { settings: fallback, damaged: true }
  } catch {
    return { settings: fallback, damaged: true } // not silent: `damaged` is shown on the Settings screen
  }
}
// Returns the error text when the write failed (quota, blocked storage), like gameModel.autosave.
export function writeSettings(store: KeyValueStore, s: Settings): string | undefined {
  try {
    store.setItem(SETTINGS_KEY, JSON.stringify(s))
    return undefined
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
}
export interface RootLike {
  dataset: Record<string, string | undefined>
  classList: { toggle(name: string, force: boolean): unknown }
}
// <html data-text="L" class="hc reduce-motion soften">: tokens.css and motion.css key off these.
export function applySettings(root: RootLike, s: Settings): void {
  root.dataset['text'] = s.textSize
  root.classList.toggle('hc', s.highContrast)
  root.classList.toggle('reduce-motion', s.reducedMotion)
  root.classList.toggle('soften', s.soften)
}
