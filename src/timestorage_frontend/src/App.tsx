import { FC, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import DetailPage from './pages/DetailPage'
import WizardPage from './pages/WizardPage'
import LoginPage from './pages/LoginPage'
import MockDashboard from './components/MockDashboard'
import MockDashboardRedirect from './pages/MockDashboardRedirect'
import { DataProvider } from './context/DataContext'
import './globals.css'
import { authService } from './store/auth.store'
import { isInAuthCallback } from './services/auth0Service'
import LoadingView from './components/LoadingView'
import Auth0CallbackPage from './pages/Auth0CallbackPage'

// Theme provider wrapper component
const ThemeProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className='min-h-screen  font-sans antialiased'>
      {/* This ensures our UI components inherit the theme */}
      <div className='relative flex min-h-screen flex-col'>{children}</div>
    </div>
  )
}

// Single initialization promise to ensure authService.init() runs only once (even in StrictMode)
let authInitPromise: Promise<void> | null = null

const App: FC = () => {
  const [isInitializing, setIsInitializing] = useState(true)
  // Initialize auth service
  useEffect(() => {
    const initialize = async () => {
      if (authInitPromise) {
        await authInitPromise
        setIsInitializing(false)
        return
      }
      try {
        authInitPromise = authService.init()
        await authInitPromise
        setIsInitializing(false)

        // Check if we're in an Auth0 callback
        if (isInAuthCallback()) {
          return
        }
      } catch (error) {
        console.error('Initialization error:', error)
        setIsInitializing(false)
      }
    }

    initialize()
  }, [])

  if (isInitializing) {
    return <LoadingView message='Initializing...' />
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <DataProvider>
          <Routes>
            <Route path='/' element={<MockDashboardRedirect />} />
            <Route path='/mock-dashboard' element={<MockDashboard />} />
            <Route path='/:projectId' element={<Dashboard />} />
            <Route path='/mock-sandbox' element={<Dashboard />} />
            <Route path='/:projectId/:sectionId' element={<DetailPage />} />
            <Route path='/:projectId/wizard/:sectionId' element={<WizardPage />} />
            <Route path='/:projectId/wizard' element={<WizardPage />} />
            <Route path='/:projectId/forms' element={<div>Forms Page</div>} />
            <Route path='/:projectId/gallery' element={<div>Gallery Page</div>} />
            <Route path='/:projectId/profile' element={<div>Profile Page</div>} />
            <Route path='/auth/auth0/callback' element={<Auth0CallbackPage />} />
            <Route path='/login' element={<LoginPage />} />
          </Routes>
        </DataProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
