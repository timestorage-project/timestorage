import { FC, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import DetailPage from './pages/DetailPage'
import WizardPage from './pages/WizardPage'
import LoginPage from './pages/LoginPage'
import ProjectDashboard from './pages/ProjectDashboard'
import MockDashboard from './components/MockDashboard'
import MockDashboardRedirect from './pages/MockDashboardRedirect'
import LinkingPage from './pages/LinkingPage'
import HistoryDashboard from './pages/HistoryDashboard'
import InstallerDashboard from './pages/InstallerDashboard'
import { useTranslation } from './hooks/useTranslation'
import GoPage from './pages/GoPage'
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

// Component that contains all routes
const AppRoutes: FC = () => {
  return (
    <Routes>
      <Route path='/' element={<MockDashboardRedirect />} />
      <Route path='/go' element={<GoPage />} />
      <Route path='/history' element={<HistoryDashboard />} />
      <Route path='/installer-dashboard' element={<InstallerDashboard />} />
      <Route path='/view/mock-dashboard' element={<MockDashboard />} />
      <Route path='/project/:projectId' element={<ProjectDashboard />} />
      <Route path='/project/from-equipment/:uuid' element={<ProjectDashboard />} />
      <Route path='/view/:uuid' element={<Dashboard />} />
      <Route path='/view/mock-sandbox' element={<Dashboard />} />
      <Route path='/view/:uuid/:sectionId' element={<DetailPage />} />
      <Route path='/view/:uuid/wizard/:sectionId' element={<WizardPage />} />
      <Route path='/view/:uuid/wizard' element={<WizardPage />} />
      <Route path='/view/:uuid/forms' element={<div>Forms Page</div>} />
      <Route path='/view/:uuid/gallery' element={<div>Gallery Page</div>} />
      <Route path='/view/:uuid/profile' element={<div>Profile Page</div>} />
      <Route path='/auth/auth0/callback' element={<Auth0CallbackPage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/linking/:uuid' element={<LinkingPage />} />
    </Routes>
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

  const { t } = useTranslation()

  if (isInitializing) {
    return <LoadingView message={t('LOADING_INITIALIZING')} />
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
