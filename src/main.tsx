// main.tsx — app entry: mounts <App /> and loads global styles
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import './ui/styles/tokens.css'
import './ui/styles/base.css'
import './ui/styles/play.css'
const root = document.getElementById('root')
if (!root) throw new Error('#root missing in index.html')
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
