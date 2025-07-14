import { FC, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LoadingView from '@/components/LoadingView'
import HistoryDashboard from './HistoryDashboard'

const GoPage: FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const serialNo = params.get('SERIALNO')

    if (serialNo) {
      navigate(`/view/${serialNo}`)
    } else {
      // No query parameters, show history dashboard
      setShowHistory(true)
    }
  }, [location, navigate])

  if (showHistory) {
    return <HistoryDashboard />
  }

  return <LoadingView message='Redirecting...' />
}

export default GoPage
