import { FC } from 'react'
import { Home, LogIn, LogOut, Building2 } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useData } from '@/context/DataContext'
import { BottomNav } from './ui/bottom-nav'
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

  return (
    <BottomNav>
            <div
        className='flex items-center justify-center gap-2 p-2 bg-background text-primary cursor-pointer'
        onClick={() => navigate(`/view/${equipmentUuid}`)}
      >
        <Home className='h-5 w-5' />
        <span className='text-sm font-medium'>Home</span>
      </div>
            {project && !location.pathname.startsWith('/project/') && (
        <div
          className='flex items-center justify-center gap-2 p-2 bg-background text-primary cursor-pointer'
          onClick={() => navigate(`/project/from-equipment/${equipmentUuid}`)}
        >
          <Building2 className='h-5 w-5' />
          <span className='text-sm font-medium'>Project</span>
        </div>
      )}
      {isAuthenticated ? (
        <div
          className='flex items-center justify-center gap-2 p-2 bg-background text-primary cursor-pointer'
          onClick={handleLogout}
        >
          <LogOut className='h-5 w-5' />
          <span className='text-sm font-medium'>Logout</span>
        </div>
      ) : (
        <div
          className='flex items-center justify-center gap-2 p-2 bg-background text-primary cursor-pointer'
          onClick={handleLogin}
        >
          <LogIn className='h-5 w-5' />
          <span className='text-sm font-medium'>Login</span>
        </div>
      )}
    </BottomNav>
  )
}

export default BottomNavigation
