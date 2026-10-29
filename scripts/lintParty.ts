// scripts/lintParty.ts — warns when an effect list recruits a companion who would walk out at once (HONOR §6, D31): the author-time half of the engine's refusal. It starts from each npc's starting trust / fear, so it is a hint, not a proof.
import { clamp, FEAR_RANGE, TRUST_RANGE } from '../src/engine/bounds'
import { wouldLeave } from '../src/engine/relations'
import type { Story } from '../src/engine/types'
import { effectListsOf } from './lintWalk'
export function lintParty(story: Story, warnings: string[]): void {
  for (const scene of Object.values(story.scenes)) {
    for (const { where, list } of effectListsOf(scene)) {
      const now = new Map<string, { trust: number; fear: number }>()
      const at = (id: string): { trust: number; fear: number } => now.get(id) ?? { trust: story.npcs[id]?.trust ?? 0, fear: story.npcs[id]?.fear ?? 0 }
      const joined: string[] = []
      for (const e of list) {
        if (e[0] === 'trust') now.set(e[1], { ...at(e[1]), trust: clamp(at(e[1]).trust + e[2], TRUST_RANGE) })
        else if (e[0] === 'fear') now.set(e[1], { ...at(e[1]), fear: clamp(at(e[1]).fear + e[2], FEAR_RANGE) })
        else if (e[0] === 'party' && e[1].startsWith('+')) {
          const id = e[1].slice(1)
          joined.push(id)
          if (wouldLeave({ alive: true, ...at(id) }, story.social)) warnings.push(`${where}: party ${e[1]} with trust ${at(id).trust} / fear ${at(id).fear} would walk out at once, so the engine refuses the join (leave line ${story.social.leaveTrust}, fear holds at ${story.social.fearHolds})`)
        }
      }
      for (const id of joined) if (wouldLeave({ alive: true, ...at(id) }, story.social) && !warnings.some((w) => w.startsWith(`${where}: party +${id}`))) warnings.push(`${where}: ${id} joins, then ends the list with trust ${at(id).trust} / fear ${at(id).fear} and walks out in the same list (no toast, no scene)`)
    }
  }
}