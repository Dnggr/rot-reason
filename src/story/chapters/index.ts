// story/chapters/index.ts — chapter registry (lazy-loaded by chapter). Holds the test chapter until M4 writes the Prologue.
import type { Scene } from '../../engine/types'
export type ChapterLoader = () => Promise<{ scenes: Scene[] }>
export const chapters: Record<string, ChapterLoader> = {
  test: () => import('./test'),
}
