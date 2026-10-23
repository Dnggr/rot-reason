// story/chapters/index.ts — chapter registry (lazy-loaded by chapter). Prologue part 1 (the intro) then the test chapter, which stays as a stand-in until M4 writes the rest of the Prologue and Ch1.
import type { Scene } from '../../engine/types'
export type ChapterLoader = () => Promise<{ scenes: Scene[] }>
export const chapters: Record<string, ChapterLoader> = {
  prologue: () => import('./prologue'),
  test: () => import('./test'),
}
