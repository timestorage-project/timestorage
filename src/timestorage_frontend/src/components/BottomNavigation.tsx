import { FC } from 'react'
import { Home, LogIn, LogOut, Building2, Package, Wrench } from 'lucide-react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useData } from '@/context/DataContext'
import { useAuthStore } from '@/store/auth.store'
import { loginWithAuth0, logoutWithAuth0 } from '@/services/auth0Service'
import { useTranslation } from '../hooks/useTranslation'

const BottomNavigation: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  
  // Extract UUID from route params
  const { uuid: routeUuid, projectId } = useParams<{ uuid?: string; projectId?: string }>()
  
  // For routes like /project/from-equipment/:uuid, extract the uuid
  let extractedUuid = routeUuid || projectId
  if (location.pathname.includes('/from-equipment/')) {
    const pathParts = location.pathname.split('/')
    const fromEquipmentIndex = pathParts.findIndex(part => part === 'from-equipment')
    if (fromEquipmentIndex !== -1 && pathParts[fromEquipmentIndex + 1]) {
      extractedUuid = pathParts[fromEquipmentIndex + 1]
    }
  }
  
  // Always call useData hook - it handles empty/undefined UUIDs gracefully
  const { uuid, project } = useData(extractedUuid)

  // Get the current equipment UUID from the project if available, otherwise use the context uuid
  const equipmentUuid = uuid
  const { isAuthenticated, isInstaller } = useAuthStore()

  const handleLogin = async () => {
    await loginWithAuth0()
  }

  const handleLogout = async () => {
    await logoutWithAuth0()
  }

  const isMainHomeActive = location.pathname === '/go'
  const isProductHomeActive = location.pathname === `/view/${equipmentUuid}`
  const isProjectActive = location.pathname.startsWith('/project/')
  const isInstallerDashboardActive = location.pathname === '/installer-dashboard'

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
        onClick={() => {
          if (!project) return
          
          // Check if we have a projectId in the route params or if the project.uuid is the projectId
          if (projectId) {
            // We're in project context, use direct project route
            navigate(`/project/${project.uuid}`)
          } else if (equipmentUuid) {
            // We're in equipment context, use from-equipment route
            navigate(`/project/from-equipment/${equipmentUuid}`)
          }
        }}
        disabled={!project || isProjectActive}
      >
        <Building2 className='size-[1.2em]' />
        <span className='dock-label'>{t('BOTTOM_NAV_PROJECT')}</span>
      </button>

      {/* Installer Dashboard Button - Only show if user is authenticated and installer */}
      {isAuthenticated && isInstaller && (
        <button
          className={isInstallerDashboardActive ? 'dock-active' : ''}
          onClick={() => navigate('/installer-dashboard')}
        >
          <Wrench className='size-[1.2em]' />
          <span className='dock-label'>{t('INSTALLER_DASHBOARD')}</span>
        </button>
      )}

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
