// engine/ids.ts — scene id conventions: chapter prefix, system scenes, the $resume sentinel, safe scene lookup
import type { SceneId, Scene, Story } from './types'
export const SYS_MISSING = 'sys.missing' // fallback for a target that does not exist
export const SYS_ERROR = 'sys.error' // fallback after the reducer threw
export const SYS_DEATH = 'sys.death' // entered when hp reaches 0
export const SYS_SCENES: readonly SceneId[] = [SYS_MISSING, SYS_ERROR, SYS_DEATH]
export const RESUME = '$resume' // exit of an echo scene: go where the player was heading
export const chapterOf = (id: SceneId): string => id.split('.')[0] ?? id
export const isSys = (id: SceneId): boolean => id.startsWith('sys.')
export function findScene(story: Story, id: SceneId): Scene | undefined {
  return Object.hasOwn(story.scenes, id) ? story.scenes[id] : undefined
}