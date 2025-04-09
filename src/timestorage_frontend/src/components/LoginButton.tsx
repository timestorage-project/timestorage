import { FC, useState } from 'react'
import { Button, CircularProgress } from '@mui/material'
import { useAuthStore } from '@/store/auth.store'
import { loginWithAuth0, logoutWithAuth0 } from '@/services/auth0Service'

interface LoginButtonProps {
  variant?: 'text' | 'outlined' | 'contained'
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'
  fullWidth?: boolean
}

const LoginButton: FC<LoginButtonProps> = ({ variant = 'contained', color = 'primary', fullWidth = false }) => {
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
    <Button
      variant={variant}
      color={color}
      fullWidth={fullWidth}
      onClick={isAuthenticated ? handleLogout : handleLogin}
      disabled={loading}
      startIcon={loading ? <CircularProgress size={20} color='inherit' /> : null}
    >
      {isAuthenticated ? 'Logout' : 'Login with Auth0'}
    </Button>
  )
}

export default LoginButton
