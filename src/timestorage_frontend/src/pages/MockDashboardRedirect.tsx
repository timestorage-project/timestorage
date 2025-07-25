import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingView from '@/components/LoadingView'
import { useTranslation } from '@/hooks/useTranslation'

const MockDashboardRedirect = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    // Immediately navigate to the go route (history dashboard)
    navigate('/go')
  }, [navigate])

  // Render a loading view while the navigation occurs
  return <LoadingView message={t('LOADING_REDIRECTING')} />
}

export default MockDashboardRedirect
