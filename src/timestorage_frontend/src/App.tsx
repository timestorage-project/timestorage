import { FC, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import DetailPage from './pages/DetailPage'
import WizardPage from './pages/WizardPage'
import MockDashboard from './components/MockDashboard'
import MockDashboardRedirect from './pages/MockDashboardRedirect'
import { DataProvider } from './context/DataContext'
import './globals.css'
import { authService } from './store/auth.store'
import { isInAuthCallback, handleAuth0Callback } from './services/auth0Service'
import LoadingView from './components/LoadingView'

// Theme provider wrapper component
const ThemeProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className='min-h-screen  font-sans antialiased'>
      {/* This ensures our UI components inherit the theme */}
      <div className='relative flex min-h-screen flex-col'>{children}</div>
    </div>
  )
}

const App: FC = () => {
  const [isInitializing, setIsInitializing] = useState(true)
  const [isProcessingCallback, setIsProcessingCallback] = useState(false)

  // Initialize auth service
  useEffect(() => {
    const initialize = async () => {
      try {
        await authService.init()
        setIsInitializing(false)

        // Check if we're in an Auth0 callback
        if (isInAuthCallback()) {
          setIsProcessingCallback(true)
          await handleAuth0Callback()
          setIsProcessingCallback(false)
        }
      } catch (error) {
        console.error('Initialization error:', error)
        setIsInitializing(false)
      }
    }

    initialize()
  }, [])

  if (isInitializing || isProcessingCallback) {
    return <LoadingView message={isProcessingCallback ? 'Completing login...' : 'Initializing...'} />
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <DataProvider>
          <Routes>
            <Route path='/' element={<MockDashboardRedirect />} />
            <Route path='/mock-dashboard' element={<MockDashboard />} />
            <Route path='/:projectId' element={<Dashboard />} />
            <Route path='/:projectId/:sectionId' element={<DetailPage />} />
            <Route path='/:projectId/wizard/:sectionId' element={<WizardPage />} />
            <Route path='/:projectId/wizard' element={<WizardPage />} />
            <Route path='/:projectId/forms' element={<div>Forms Page</div>} />
            <Route path='/:projectId/gallery' element={<div>Gallery Page</div>} />
            <Route path='/:projectId/profile' element={<div>Profile Page</div>} />
          </Routes>
        </DataProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
