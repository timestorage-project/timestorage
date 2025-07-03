import { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleAuth0Callback } from '@/services/auth0Service'
import LoadingView from '@/components/LoadingView'

const Auth0CallbackPage: FC = () => {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const completeAuth = async () => {
      try {
        await handleAuth0Callback()
        // handleAuth0Callback already redirects to intended url via history.replaceState
        // In case there is none, fall back to root
        navigate('/', { replace: true })
      } catch (err) {
        console.error('Auth0 callback handling failed', err)
        setError('Authentication failed. Please try logging in again.')
      }
    }

    completeAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return <div className='flex h-screen w-screen items-center justify-center text-red-600'>{error}</div>
  }

  return <LoadingView message='Completing login...' />
}

export default Auth0CallbackPage
