import { FC } from 'react'
import { Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useData } from '@/context/DataContext'
import { BottomNav } from './ui/bottom-nav'

const BottomNavigation: FC = () => {
  const navigate = useNavigate()
  const { projectId } = useData()

  return (
    <BottomNav>
      <div
        className='flex items-center justify-center gap-2 p-2 text-primary cursor-pointer'
        onClick={() => navigate(`/${projectId}`)}
      >
        <Home className='h-5 w-5' />
        <span className='text-sm font-medium'>Home</span>
      </div>
      {/* Additional navigation items can be added here when needed */}
    </BottomNav>
  )
}

export default BottomNavigation
