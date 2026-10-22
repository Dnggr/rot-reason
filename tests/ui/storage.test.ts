// tests/ui/storage.test.ts — openStore: localStorage when it works, an in-memory store flagged non-persistent when it does not
import { describe, expect, it } from 'vitest'
import { memoryStore, openStore } from '../../src/ui/storage'
function fakeStorage(): Storage {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), clear: () => m.clear(), key: () => null, length: 0 }
}
describe('openStore', () => {
  it('uses the browser storage when it works and leaves no probe key behind', () => {
    const ls = fakeStorage()
    const r = openStore(() => ls)
    expect(r.persistent).toBe(true)
    expect(r.store).toBe(ls)
    expect(ls.getItem('rr_probe')).toBeNull()
  })
  it('falls back to memory when the storage cannot be reached', () => {
    const r = openStore(() => {
      throw new Error('SecurityError')
    })
    expect(r.persistent).toBe(false)
    r.store.setItem('k', 'v')
    expect(r.store.getItem('k')).toBe('v')
  })
  it('falls back to memory when writing throws (quota, private mode)', () => {
    const ls = { ...fakeStorage(), setItem: () => { throw new Error('QuotaExceededError') } }
    expect(openStore(() => ls).persistent).toBe(false)
  })
  it('memoryStore returns null for a missing key', () => {
    expect(memoryStore().getItem('nope')).toBeNull()
  })
})
