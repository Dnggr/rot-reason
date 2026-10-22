// ui/hooks/useStory.ts — loads the story (chapters are lazy) and reports loading / ready / failed
import { useEffect, useState } from 'react'
import type { Story } from '../../engine/types'
import { loadStory } from '../../story/index'
export type StoryLoad = { status: 'loading' } | { status: 'ready'; story: Story } | { status: 'failed'; error: string }
export function useStory(): StoryLoad {
  const [load, setLoad] = useState<StoryLoad>({ status: 'loading' })
  useEffect(() => {
    let live = true
    loadStory().then(
      (story) => live && setLoad({ status: 'ready', story }),
      (e: unknown) => live && setLoad({ status: 'failed', error: e instanceof Error ? e.message : String(e) }),
    )
    return () => {
      live = false
    }
  }, [])
  return load
}
