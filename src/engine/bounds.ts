// engine/bounds.ts — the one place values are clamped; throws on NaN/Infinity (ARCHITECTURE rule 6)
import type { StatKey } from './types'
export type Range = readonly [min: number, max: number]
export const STAT_RANGE: Record<StatKey, Range> = { hp: [0, 5], reason: [0, 100], rot: [0, 100] }
export const RES_RANGE: Range = [0, 9]
export const HONOR_RANGE: Range = [-100, 100]
export const TRUST_RANGE: Range = [-100, 100]
export const FEAR_RANGE: Range = [0, 100]
export const DAY_RANGE: Range = [1, 21]
export function clamp(n: number, [min, max]: Range): number {
  if (!Number.isFinite(n)) throw new RangeError(`bounds: not a finite number (${String(n)})`)
  return Math.min(max, Math.max(min, n))
}
