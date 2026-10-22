// story/system.ts — system scenes the engine falls back to: missing scene, thrown error, death (ARCHITECTURE §5.4)
import type { Scene } from '../engine/types'
export const SYSTEM_SCENES: Scene[] = [
  { id: 'sys.missing', mood: 'glitch', text: 'The story loses its thread here. This is a bug, not your fault. Copy the debug report, then restart the chapter.', end: 'sys_error' },
  { id: 'sys.error', mood: 'glitch', text: 'Something broke while the story was running. Copy the debug report, then restart the chapter or begin a new game.', end: 'sys_error' },
  { id: 'sys.death', mood: 'dread', text: 'Your legs stop answering. The street tilts, then goes quiet. Marrow Bay does not notice.', end: 'death' },
]
