// story/chapters/index.ts — chapter registry (lazy-loaded by chapter). Empty until M4.
import type { Scene } from '../../engine/types'

export type ChapterLoader = () => Promise<{ scenes: Scene[] }>

export const chapters: Record<string, ChapterLoader> = {}
