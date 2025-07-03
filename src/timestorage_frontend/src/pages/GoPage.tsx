import { FC, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LoadingView from '@/components/LoadingView'

const GoPage: FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const serialNo = params.get('SERIALNO')

    if (serialNo) {
      navigate(`/view/${serialNo}`)
    }
  }, [location, navigate])

  return <LoadingView message='Redirecting...' />
}

export default GoPage
