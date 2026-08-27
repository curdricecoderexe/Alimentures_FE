import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { HelmetProvider } from 'react-helmet-async'
import ErrorBoundary from './components/ErrorBoundary'
import { installGlobalErrorReporting } from './lib/reportError'

installGlobalErrorReporting()

const root = createRoot(document.getElementById('root'))

root.render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)

// Remove the HTML-level splash loader after React paints its first frame.
// Using requestAnimationFrame twice ensures the browser has actually committed pixels.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const loader = document.getElementById('initial-loader')
    if (!loader) return

    // Smooth fade-out then remove from DOM
    loader.style.transition = 'opacity 0.45s ease, visibility 0.45s ease'
    loader.style.opacity = '0'
    loader.style.visibility = 'hidden'

    setTimeout(() => {
      loader.remove()
    }, 500)
  })
})
