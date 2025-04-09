import { FC, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import DetailPage from './pages/DetailPage'
import WizardPage from './pages/WizardPage'
import { DataProvider } from './context/DataContext'
import { authService } from './store/auth.store'
import { isInAuthCallback, handleAuth0Callback } from './services/auth0Service'
import LoadingView from './components/LoadingView'
import LoginPage from './pages/LoginPage'

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
      <DataProvider>
        <Routes>
          <Route path='/login' element={<LoginPage />} />
          <Route path='/' element={<Navigate to={window.location.pathname.split('/')[1] || ''} replace />} />
          <Route path='/:projectId' element={<Dashboard />} />
          <Route path='/:projectId/:sectionId' element={<DetailPage />} />
          <Route path='/:projectId/wizard/:sectionId' element={<WizardPage />} />
          <Route path='/:projectId/wizard' element={<WizardPage />} />
          <Route path='/:projectId/forms' element={<div>Forms Page</div>} />
          <Route path='/:projectId/gallery' element={<div>Gallery Page</div>} />
          <Route path='/:projectId/profile' element={<div>Profile Page</div>} />
        </Routes>
      </DataProvider>
    </BrowserRouter>
  )
}

export default App
