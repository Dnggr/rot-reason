// tests/smoke.test.ts — M0 smoke: story registry loads and is empty-but-valid
import { describe, expect, it } from 'vitest'
import { chapters } from '../src/story/chapters/index'
describe('story registry', () => {
  it('loads without throwing', () => {
    expect(typeof chapters).toBe('object')
  })
  it('every chapter loader resolves to a scenes array', async () => {
    for (const load of Object.values(chapters)) {
      const mod = await load()
      expect(Array.isArray(mod.scenes)).toBe(true)
    }
  })
})
