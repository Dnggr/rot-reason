// tests/ui/settings.test.ts — settings: defaults, read / write (damaged and failing storage never throw), and how they reach <html>
import { describe, expect, it } from 'vitest'
import { applySettings, defaultSettings, readSettings, SETTINGS_KEY, TEXT_SIZES, writeSettings, type RootLike, type Settings } from '../../src/ui/settings'
import { memoryStore } from '../../src/ui/storage'
const all: Settings = { textSize: 'XL', soften: true, reducedMotion: true, highContrast: true, sound: true }
describe('defaults', () => {
  it('start at Medium with everything off; the first run follows the device\'s reduced-motion preference', () => {
    expect(defaultSettings()).toEqual({ textSize: 'M', soften: false, reducedMotion: false, highContrast: false, sound: false })
    expect(defaultSettings(true).reducedMotion).toBe(true)
    expect(TEXT_SIZES).toEqual(['S', 'M', 'L', 'XL'])
  })
})
describe('readSettings / writeSettings', () => {
  it('an empty store gives the defaults, not damaged', () => {
    expect(readSettings(memoryStore())).toEqual({ settings: defaultSettings(), damaged: false })
    expect(readSettings(memoryStore(), true).settings.reducedMotion).toBe(true)
  })
  it('what was written is read back, and a stored value beats the device preference', () => {
    const store = memoryStore()
    expect(writeSettings(store, all)).toBeUndefined()
    expect(readSettings(store)).toEqual({ settings: all, damaged: false })
    writeSettings(store, { ...all, reducedMotion: false })
    expect(readSettings(store, true).settings.reducedMotion).toBe(false)
  })
  it('unreadable JSON, a wrong shape, a bad value or an unknown key are damaged: defaults, flagged', () => {
    for (const raw of ['{nope', '[]', '{"textSize":"M"}', JSON.stringify({ ...all, textSize: 'huge' }), JSON.stringify({ ...all, extra: 1 })]) {
      const store = memoryStore()
      store.setItem(SETTINGS_KEY, raw)
      expect(readSettings(store)).toEqual({ settings: defaultSettings(), damaged: true })
    }
  })
  it('a failing write returns the error text instead of throwing', () => {
    const store = { getItem: () => null, setItem: () => { throw new Error('quota') } }
    expect(writeSettings(store, all)).toBe('quota')
    expect(writeSettings({ getItem: () => null, setItem: () => { throw 'plain' } }, all)).toBe('plain')
  })
})
describe('applySettings', () => {
  const fakeRoot = (): { root: RootLike; on: Set<string> } => {
    const on = new Set<string>()
    return { on, root: { dataset: {}, classList: { toggle: (n, force) => (force ? on.add(n) : on.delete(n)) } } }
  }
  it('puts the text size in data-text and the switches in classes', () => {
    const { root, on } = fakeRoot()
    applySettings(root, all)
    expect(root.dataset['text']).toBe('XL')
    expect([...on].sort()).toEqual(['hc', 'reduce-motion', 'soften'])
  })
  it('takes the classes off again', () => {
    const { root, on } = fakeRoot()
    applySettings(root, all)
    applySettings(root, defaultSettings())
    expect(root.dataset['text']).toBe('M')
    expect(on.size).toBe(0)
  })
})
