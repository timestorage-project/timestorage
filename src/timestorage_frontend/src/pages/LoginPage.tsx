import { FC, useEffect } from 'react'

import { useNavigate } from 'react-router-dom'
import LoginButton from '@/components/LoginButton'
import { useAuthStore } from '@/store/auth.store'

const LoginPage: FC = () => {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state: { isAuthenticated: boolean }) => state.isAuthenticated)

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div className='rounded-2xl bg-card p-8 shadow-lg flex flex-col items-center'>
          <h1 className='text-3xl font-bold text-center mb-4 text-card-foreground'>Welcome to TimeStorage</h1>
          <p className='text-base text-muted-foreground text-center mb-6'>
            Please login to access your projects and data
          </p>
          <div className='mt-8 w-full'>
            <LoginButton />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
