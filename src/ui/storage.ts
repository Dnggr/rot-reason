// ui/storage.ts — the store behind saves: localStorage when it works, memory otherwise (private mode, blocked storage); `persistent` tells the UI to warn
import type { KeyValueStore } from '../engine/save'
export interface EraseStore extends KeyValueStore {
  removeItem(key: string): void // Settings > Reset saved game
}
export interface Store {
  store: EraseStore
  persistent: boolean
}
export function memoryStore(): EraseStore {
  const m = new Map<string, string>()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }
}
export function openStore(pick: () => Storage = () => window.localStorage): Store {
  try {
    const ls = pick()
    ls.setItem('rr_probe', '1')
    ls.removeItem('rr_probe')
    return { store: ls, persistent: true }
  } catch {
    return { store: memoryStore(), persistent: false } // not silent: the Title screen shows S.noStorage
  }
}
