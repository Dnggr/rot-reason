// tests/engine/testStory.ts — the real story started at the test chapter (t.wake), for tests that exercise the feature-coverage fixture
import type { Story } from '../../src/engine/types'
import { loadStory } from '../../src/story/index'
export async function loadTestChapterStory(): Promise<Story> {
  return { ...(await loadStory()), start: 't.wake' }
}