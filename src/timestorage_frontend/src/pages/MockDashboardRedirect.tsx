import { FC, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingView from '@/components/LoadingView'

const MockDashboardRedirect: FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to the mock dashboard
    navigate('/view/mock-dashboard')
  }, [navigate])

  return <LoadingView message='Redirecting to mock dashboard...' />
}

export default MockDashboardRedirect
