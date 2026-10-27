// scripts/lintLists.ts — effect-list checks: an unwitnessed deed with no `secret` after it (forfeited), the same echo twice in one list, an echo `at` the chapter it is scheduled in (M3 s7, D35)
import { chapterOf } from '../src/engine/ids'
import type { Effect, Story } from '../src/engine/types'
import { effectListsOf } from './lintWalk'
const sameEcho = (a: Effect, b: Effect): boolean => a[0] === 'echo' && b[0] === 'echo' && JSON.stringify(a[1]) === JSON.stringify(b[1])
export function lintLists(story: Story, warnings: string[]): void {
  for (const scene of Object.values(story.scenes)) {
    for (const { where, list } of effectListsOf(scene)) {
      let hidden: string[] = [] // unwitnessed deeds still waiting for a `secret` to hold them (effects.applyAll)
      list.forEach((e, i) => {
        if (e[0] === 'honor' && !e[2]) hidden = [...hidden, e[1]]
        if (e[0] === 'secret') hidden = []
        if (e[0] === 'echo' && list.slice(0, i).some((p) => sameEcho(p, e))) warnings.push(`${where}: echo ${e[1].scene} is scheduled twice in one list; the engine keeps one (an identical pending echo is skipped)`)
        if (e[0] === 'echo' && e[1].at !== undefined && e[1].at === chapterOf(scene.id)) warnings.push(`${where}: echo ${e[1].scene} is due 'at' ${e[1].at}, the chapter this scene is in, so it fires at the very next transition, not at a chapter start (use \`after\`, or name a later chapter)`)
      })
      if (hidden.length > 0) warnings.push(`${where}: unwitnessed deed ${hidden.join(', ')} has no \`secret\` after it in the list: the engine forfeits it (nothing is owed, nobody ever reacts); put \`['secret', id]\` after the deed or make it witnessed`)
    }
  }
}
