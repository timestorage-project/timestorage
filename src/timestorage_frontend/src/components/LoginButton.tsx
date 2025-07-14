import { FC, useState } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { loginWithAuth0, logoutWithAuth0 } from '@/services/auth0Service'

interface LoginButtonProps {
  fullWidth?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const LoginButton: FC<LoginButtonProps> = ({ 
  fullWidth = true, 
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
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

  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'w-full' : '',
    loading ? 'loading' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      className={buttonClasses}
      onClick={isAuthenticated ? handleLogout : handleLogin}
      disabled={loading}
      type="button"
    >
      {!loading && (
        isAuthenticated ? (
          <LogOut className="w-4 h-4 mr-2" />
        ) : (
          <LogIn className="w-4 h-4 mr-2" />
        )
      )}
      {isAuthenticated ? 'Logout' : 'Login with Auth0'}
    </button>
  )
}

export default LoginButton
