// ui/lockReason.ts — words for a locked choice, derived from its `lock` condition (D20). Flags, secrets and nested conditions stay generic so a lock never spoils.
import { TIER_ORDER } from '../engine/honor'
import type { Cmp, Condition, Tier } from '../engine/types'
import { shortName } from './names'
import { S } from './strings'
function amount(label: string, cmp: Cmp, n: number): string {
  switch (cmp) {
    case '>=': return S.lock.atLeast(label, n)
    case '>': return S.lock.atLeast(label, n + 1)
    case '<=': return S.lock.atMost(label, n)
    case '<': return S.lock.atMost(label, n - 1)
    case '==': return S.lock.exactly(label, n)
  }
}
const tierName = (i: number): string | undefined => {
  const t = TIER_ORDER[i]
  return t === undefined ? undefined : S.tier[t]
}
function tierText(cmp: Cmp, t: Tier): string {
  const i = TIER_ORDER.indexOf(t)
  const at = (k: number): string => tierName(k) ?? S.lock.generic // an unreachable bound reads as generic
  switch (cmp) {
    case '>=': return S.lock.tierUp(at(i))
    case '>': return tierName(i + 1) === undefined ? S.lock.generic : S.lock.tierUp(at(i + 1))
    case '<=': return S.lock.tierDown(at(i))
    case '<': return tierName(i - 1) === undefined ? S.lock.generic : S.lock.tierDown(at(i - 1))
    case '==': return at(i)
  }
}
export function describeLock(c: Condition): string {
  if ('all' in c || 'any' in c || 'not' in c) return S.lock.generic
  switch (c[0]) {
    case 'trait': return S.lock.needs(c[1])
    case 'honor': return amount(S.honor, c[1], c[2])
    case 'stat': return amount(S.stat[c[1]], c[2], c[3])
    case 'attr': return amount(S.attr[c[1]], c[2], c[3])
    case 'res': return amount(S.res[c[1]], c[2], c[3])
    case 'day': return amount(S.day, c[1], c[2])
    case 'tier': return tierText(c[1], c[2])
    case 'trust': return c[2] === '>=' || c[2] === '>' ? S.lock.trust(shortName(c[1])) : S.lock.generic
    case 'fear': return c[2] === '>=' || c[2] === '>' ? S.lock.fear(shortName(c[1])) : S.lock.generic
    case 'party': return S.lock.withYou(shortName(c[1]))
    case 'alive': return S.lock.alive(shortName(c[1]))
    default: return S.lock.generic
  }
}