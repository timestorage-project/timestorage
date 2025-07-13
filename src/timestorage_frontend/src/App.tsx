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
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import { useTranslation } from './hooks/useTranslation'
import GoPage from './pages/GoPage'
import './globals.css'
import './styles/toast.css'
import { authService } from './store/auth.store'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
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
      {/* Public routes */}
      <Route path='/' element={
        <PublicRoute>
          <MockDashboardRedirect />
        </PublicRoute>
      } />
      <Route path='/go' element={
        <PublicRoute>
          <GoPage />
        </PublicRoute>
      } />
      <Route path='/history' element={
        <PublicRoute>
          <HistoryDashboard />
        </PublicRoute>
      } />
      <Route path='/view/mock-dashboard' element={
        <PublicRoute>
          <MockDashboard />
        </PublicRoute>
      } />
      <Route path='/project/:projectId' element={
        <PublicRoute>
          <ProjectDashboard />
        </PublicRoute>
      } />
      <Route path='/projects/:projectId' element={
        <PublicRoute>
          <ProjectDashboard />
        </PublicRoute>
      } />
      <Route path='/project/from-equipment/:uuid' element={
        <PublicRoute>
          <ProjectDashboard />
        </PublicRoute>
      } />
      <Route path='/view/:uuid' element={
        <PublicRoute>
          <Dashboard />
        </PublicRoute>
      } />
      <Route path='/view/mock-sandbox' element={
        <PublicRoute>
          <Dashboard />
        </PublicRoute>
      } />
      <Route path='/view/:uuid/:sectionId' element={
        <PublicRoute>
          <DetailPage />
        </PublicRoute>
      } />
      <Route path='/view/:uuid/wizard/:sectionId' element={
        <PublicRoute>
          <WizardPage />
        </PublicRoute>
      } />
      <Route path='/view/:uuid/wizard' element={
        <PublicRoute>
          <WizardPage />
        </PublicRoute>
      } />
      <Route path='/view/:uuid/forms' element={
        <PublicRoute>
          <div>Forms Page</div>
        </PublicRoute>
      } />
      <Route path='/view/:uuid/gallery' element={
        <PublicRoute>
          <div>Gallery Page</div>
        </PublicRoute>
      } />
      <Route path='/view/:uuid/profile' element={
        <PublicRoute>
          <div>Profile Page</div>
        </PublicRoute>
      } />
      <Route path='/auth/auth0/callback' element={<Auth0CallbackPage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/linking/:projectId' element={
        <ProtectedRoute>
          <LinkingPage />
        </ProtectedRoute>
      } />
      <Route path='/linking/:projectId/:positionId' element={
        <ProtectedRoute>
          <LinkingPage />
        </ProtectedRoute>
      } />
      <Route path='/linking/:projectId/:positionId/:qrTagId' element={
        <ProtectedRoute>
          <LinkingPage />
        </ProtectedRoute>
      } />
      
      {/* Protected routes - installer dashboard and linking pages require authentication */}
      <Route path='/installer-dashboard' element={
        <ProtectedRoute>
          <InstallerDashboard />
        </ProtectedRoute>
      } />
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
        <AppRoutes />
        <ToastContainer />
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
