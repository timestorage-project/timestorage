import { FC, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingView from '@/components/LoadingView'
import { useAuthStore } from '@/store/auth.store'
import { useTranslation } from '../hooks/useTranslation'

const Auth0CallbackPage: FC = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { t } = useTranslation()

  useEffect(() => {
    const processCallback = async () => {
      try {
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        const idToken = params.get('id_token')

        if (idToken) {
          await login(idToken)
          navigate('/') // Redirect to home page after successful login
        } else {
          throw new Error('No id_token found in URL')
        }
      } catch (error) {
        console.error('Auth0 callback error:', error)
        navigate('/login?error=callback_failed') // Redirect to login with an error
      }
    }

    processCallback()
  }, [login, navigate])

  return <LoadingView message={t('LOADING_COMPLETING_LOGIN')} />
}

export default Auth0CallbackPage

