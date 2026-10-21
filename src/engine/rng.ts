// engine/rng.ts — seeded mulberry32, pure: every call takes the rng state and returns the new one
export interface Roll {
  value: number
  rng: number
}
export function initRng(seed: number): number {
  return seed | 0
}
export function nextFloat(rng: number): Roll {
  const a = (rng + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, rng: a }
}
// integer in [min, max], both inclusive
export function nextInt(rng: number, min: number, max: number): Roll {
  const r = nextFloat(rng)
  return { value: min + Math.floor(r.value * (max - min + 1)), rng: r.rng }
}
export function d6(rng: number): Roll {
  return nextInt(rng, 1, 6)
}
