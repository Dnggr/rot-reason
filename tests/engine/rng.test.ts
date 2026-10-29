// tests/engine/rng.test.ts — seeded rng: reference vector, determinism, purity, bounds, distribution
import { describe, expect, it } from 'vitest'
import { d6, initRng, nextFloat, nextInt } from '../../src/engine/rng'
function floats(seed: number, n: number): number[] {
  let rng = initRng(seed)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const r = nextFloat(rng)
    out.push(r.value)
    rng = r.rng
  }
  return out
}
describe('rng', () => {
  it('matches the reference mulberry32 sequence for seed 12345', () => {
    expect(floats(12345, 4)).toEqual([0.9797282677609473, 0.3067522644996643, 0.484205421525985, 0.817934412509203])
  })
  it('same seed gives the same sequence; different seeds differ', () => {
    expect(floats(7, 50)).toEqual(floats(7, 50))
    expect(floats(7, 5)).not.toEqual(floats(8, 5))
  })
  it('is pure: the same state always yields the same roll', () => {
    const a = nextFloat(99)
    expect(nextFloat(99)).toEqual(a)
    expect(a.rng).not.toBe(99)
  })
  it('floats stay in [0, 1)', () => {
    for (const v of floats(1, 2000)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
  it('state is a plain int32 number (JSON-safe, save-safe)', () => {
    const r = nextFloat(initRng(2 ** 40 + 5))
    expect(Number.isInteger(r.rng)).toBe(true)
    expect(r.rng).toBeGreaterThanOrEqual(-(2 ** 31))
    expect(r.rng).toBeLessThan(2 ** 31)
    expect(JSON.parse(JSON.stringify(r))).toEqual(r)
  })
  it('replays identically from a mid-stream state', () => {
    const first = nextFloat(initRng(5))
    expect(nextFloat(first.rng)).toEqual(nextFloat(first.rng))
  })
  it('nextInt covers every value in range, both ends inclusive', () => {
    let rng = initRng(3)
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) {
      const r = nextInt(rng, -2, 2)
      seen.add(r.value)
      rng = r.rng
    }
    expect([...seen].sort((x, y) => x - y)).toEqual([-2, -1, 0, 1, 2])
  })
  it('nextInt with min = max always returns it', () => {
    expect(nextInt(10, 4, 4).value).toBe(4)
  })
  it('d6 rolls 1..6 and matches the pinned sequence for seed 42', () => {
    let rng = initRng(42)
    const rolls: number[] = []
    for (let i = 0; i < 10; i++) {
      const r = d6(rng)
      rolls.push(r.value)
      rng = r.rng
    }
    expect(rolls).toEqual([4, 3, 6, 5, 2, 4, 2, 4, 6, 3])
    expect(Math.min(...rolls)).toBeGreaterThanOrEqual(1)
    expect(Math.max(...rolls)).toBeLessThanOrEqual(6)
  })
})