// scripts/lintBuild.ts — builds a Story from scenes and tables without importing src/story (so tests can lint tiny stories)
import type { Scene, Story, StoryTables } from '../src/engine/types'
export function buildStoryFrom(scenes: readonly Scene[], tables: StoryTables): Story {
  return { ...tables, scenes: Object.fromEntries(scenes.map((s) => [s.id, s])) }
}