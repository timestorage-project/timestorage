import { FC, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import LoadingView from './LoadingView'
import { useTranslation } from '../hooks/useTranslation'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, redirectTo = '/login' }) => {
  const location = useLocation()
  const { t } = useTranslation()
  const [isInitializing, setIsInitializing] = useState(true)

  const { isAuthenticated, initialized, checkAuthStatus } = useAuthStore()

  useEffect(() => {
    const initializeAuth = async () => {
      if (!initialized) {
        setIsInitializing(false)
        return
      }

      try {
        await checkAuthStatus()
      } catch (error) {
        console.error('Error checking auth status:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeAuth()
  }, [initialized, checkAuthStatus])

  // Show loading while initializing
  if (isInitializing) {
    return <LoadingView message={t('LOADING_INITIALIZING')} />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
