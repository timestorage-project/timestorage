import { FC } from 'react'
import { Home, LogIn, LogOut, Building2 } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useData } from '@/context/DataContext'
import { useAuthStore } from '@/store/auth.store'
import { loginWithAuth0, logoutWithAuth0 } from '@/services/auth0Service'

const BottomNavigation: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { uuid, project } = useData()

  // Get the current equipment UUID from the project if available, otherwise use the context uuid
  const equipmentUuid = project?.uuid || uuid
  const { isAuthenticated } = useAuthStore()

  const handleLogin = async () => {
    await loginWithAuth0()
  }

  const handleLogout = async () => {
    await logoutWithAuth0()
  }

  const isHomeActive = location.pathname === `/view/${equipmentUuid}`
  const isProjectActive = location.pathname.startsWith('/project/')

  return (
    <div className='dock dock-md bg-base-200 border-t border-base-300 p-2'>
      {/* Home Button */}
      <button className={isHomeActive ? 'dock-active' : ''} onClick={() => navigate(`/view/${equipmentUuid}`)}>
        <Home className='size-[1.2em]' />
        <span className='dock-label'>Home</span>
      </button>

      {/* Project Button - Only show if project exists and not already on project page */}
      {project && !isProjectActive && (
        <button
          className={isProjectActive ? 'dock-active' : ''}
          onClick={() => navigate(`/project/from-equipment/${equipmentUuid}`)}
        >
          <Building2 className='size-[1.2em]' />
          <span className='dock-label'>Project</span>
        </button>
      )}

      {/* Auth Button */}
      {isAuthenticated ? (
        <button onClick={handleLogout} className='text-error hover:text-error'>
          <LogOut className='size-[1.2em]' />
          <span className='dock-label'>Logout</span>
        </button>
      ) : (
        <button onClick={handleLogin} className='text-success hover:text-success'>
          <LogIn className='size-[1.2em]' />
          <span className='dock-label'>Login</span>
        </button>
      )}
    </div>
  )
}

export default BottomNavigation
