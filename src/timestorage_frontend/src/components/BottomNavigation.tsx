import { FC } from 'react'
import { Home, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useData } from '@/context/DataContext'
import { BottomNav } from './ui/bottom-nav'

const BottomNavigation: FC = () => {
  const navigate = useNavigate()
  const { uuid } = useData()

  return (
    <BottomNav>
      <div
        className='flex items-center justify-center gap-2 p-2 bg-background text-primary cursor-pointer'
        onClick={() => navigate(`/view/${uuid}`)}
      >
        <Home className='h-5 w-5' />
        <span className='text-sm font-medium'>Home</span>
      </div>
      <div
        className='flex items-center justify-center gap-2 p-2 bg-background text-primary cursor-pointer'
        onClick={() => navigate('/login')}
      >
        <LogIn className='h-5 w-5' />
        <span className='text-sm font-medium'>Login</span>
      </div>
    </BottomNav>
  )
}

export default BottomNavigation
