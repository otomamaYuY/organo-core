import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { loader } from '@monaco-editor/react'
import { installNetworkInterceptor } from '@/utils/networkInterceptor'
import './index.css'
import App from './App'

// Install network interceptor BEFORE anything else — captures every external
// fetch/XHR the app makes and surfaces it in the Privacy Center panel.
installNetworkInterceptor()

// Self-host the Monaco runtime instead of pulling it from cdn.jsdelivr.net.
// Files live under public/monaco/vs and are copied from node_modules by
// scripts/copy-monaco.mjs at install/build time. Same-origin loading is
// faster and avoids the editor getting stuck on "Loading..." when the
// jsdelivr CDN is slow or blocked.
loader.config({ paths: { vs: '/monaco/vs' } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
