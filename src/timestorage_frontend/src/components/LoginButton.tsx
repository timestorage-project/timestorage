import { FC, useState } from 'react'
import { Button as ShadcnButton } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { loginWithAuth0, logoutWithAuth0 } from '@/services/auth0Service'

interface LoginButtonProps {
  fullWidth?: boolean
}

const LoginButton: FC<LoginButtonProps> = ({ fullWidth = true }) => {
  const [loading, setLoading] = useState(false)
  const isAuthenticated = useAuthStore((state: { isAuthenticated: boolean }) => state.isAuthenticated)

  const handleLogin = async () => {
    try {
      setLoading(true)
      await loginWithAuth0()
    } catch (error) {
      console.error('Login failed:', error)
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setLoading(true)
      await logoutWithAuth0()
    } catch (error) {
      console.error('Logout failed:', error)
      setLoading(false)
    }
  }

  return (
    <ShadcnButton
      className={fullWidth ? 'w-full' : ''} // Apply w-full class conditionally
      onClick={isAuthenticated ? handleLogout : handleLogin}
      disabled={loading}
      type='button' // Good practice for buttons not submitting forms
    >
      {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
      {isAuthenticated ? 'Logout' : 'Login with Auth0'}
    </ShadcnButton>
  )
}

export default LoginButton
