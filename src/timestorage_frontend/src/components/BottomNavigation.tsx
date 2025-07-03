import { FC } from 'react'
import { Home, LogIn, LogOut, Building2, Package } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useData } from '@/context/DataContext'
import { useAuthStore } from '@/store/auth.store'
import { loginWithAuth0, logoutWithAuth0 } from '@/services/auth0Service'
import { useTranslation } from '../hooks/useTranslation'

const BottomNavigation: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { uuid, project } = useData()
  const { t } = useTranslation()

  // Get the current equipment UUID from the project if available, otherwise use the context uuid
  const equipmentUuid = project?.uuid || uuid
  const { isAuthenticated } = useAuthStore()

  const handleLogin = async () => {
    await loginWithAuth0()
  }

  const handleLogout = async () => {
    await logoutWithAuth0()
  }

  const isMainHomeActive = location.pathname === '/go'
  const isProductHomeActive = location.pathname === `/view/${equipmentUuid}`
  const isProjectActive = location.pathname.startsWith('/project/')

  return (
    <div className='dock dock-md bg-base-200 border-t border-base-300'>
      {/* Main Home Button - Goes to /go (History Dashboard) */}
      <button className={isMainHomeActive ? 'dock-active' : ''} onClick={() => navigate('/go')}>
        <Home className='size-[1.2em]' />
        <span className='dock-label'>{t('BOTTOM_NAV_HOME')}</span>
      </button>

      {/* Product Home Button - Goes to current equipment UUID dashboard */}
      <button 
        className={isProductHomeActive ? 'dock-active' : ''} 
        onClick={() => equipmentUuid && navigate(`/view/${equipmentUuid}`)}
        disabled={!equipmentUuid}
      >
        <Package className='size-[1.2em]' />
        <span className='dock-label'>{t('BOTTOM_NAV_PRODUCT_HOME')}</span>
      </button>

      {/* Project Button - Goes to project view */}
      <button
        className={isProjectActive ? 'dock-active' : ''}
        onClick={() => project && equipmentUuid && navigate(`/project/from-equipment/${equipmentUuid}`)}
        disabled={!project || isProjectActive}
      >
        <Building2 className='size-[1.2em]' />
        <span className='dock-label'>{t('BOTTOM_NAV_PROJECT')}</span>
      </button>

      {/* Auth Button */}
      {isAuthenticated ? (
        <button onClick={handleLogout} className='text-error hover:text-error'>
          <LogOut className='size-[1.2em]' />
          <span className='dock-label'>{t('BOTTOM_NAV_LOGOUT')}</span>
        </button>
      ) : (
        <button onClick={handleLogin} className='text-success hover:text-success'>
          <LogIn className='size-[1.2em]' />
          <span className='dock-label'>{t('BOTTOM_NAV_LOGIN')}</span>
        </button>
      )}
    </div>
  )
}

export default BottomNavigation
