import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './globals.css'

import { ThemeProvider } from '@/providers'
import App from './App'

// Get the root element
const container = document.getElementById('root')
// Create a root
const root = createRoot(container!)

// Render your app
root.render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>
)
