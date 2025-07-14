import { FC, useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth.store'
import LoadingView from './LoadingView'
import { useTranslation } from '../hooks/useTranslation'

interface PublicRouteProps {
  children: React.ReactNode
}

const PublicRoute: FC<PublicRouteProps> = ({ children }) => {
  const { t } = useTranslation()
  const [isInitializing, setIsInitializing] = useState(true)
  const { initialized, checkAuthStatus, accessToken } = useAuthStore()

  useEffect(() => {
    const initializeAuth = async () => {
      if (!initialized) {
        setIsInitializing(false)
        return
      }

      try {
        // Only check auth status if user has an access token
        if (accessToken) {
          await checkAuthStatus()
        }
      } catch (error) {
        console.error('Error checking auth status:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeAuth()
  }, [initialized, checkAuthStatus, accessToken])

  // Show loading while initializing
  if (isInitializing) {
    return <LoadingView message={t('LOADING_INITIALIZING')} />
  }

  // Render children once initialization is complete
  return <>{children}</>
}

export default PublicRoute
