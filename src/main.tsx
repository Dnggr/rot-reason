// main.tsx — app entry: loads global styles, mounts <App />, and loads the debug panel lazily in dev or with ?debug=1
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import type { DebugPanelComponent } from './ui/debugApi'
import './ui/styles/tokens.css'
import './ui/styles/base.css'
import './ui/styles/play.css'
import './ui/styles/stage.css'
import './ui/styles/motion.css'
const root = document.getElementById('root')
if (!root) throw new Error('#root missing in index.html')
const wantsDebug = import.meta.env.DEV || new URLSearchParams(window.location.search).get('debug') === '1'
async function loadPanel(): Promise<DebugPanelComponent | undefined> {
  if (!wantsDebug) return undefined
  try {
    return (await import('./debug/DebugPanel')).DebugPanel
  } catch (e) {
    console.error('The debug panel failed to load; playing without it.', e) // visible in the console, never silent
    return undefined
  }
}
void loadPanel().then((debugPanel) => {
  createRoot(root).render(
    <StrictMode>
      <App debugPanel={debugPanel} />
    </StrictMode>,
  )
})
