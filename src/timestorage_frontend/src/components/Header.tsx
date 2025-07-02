import { FC } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title: string
  showBack?: boolean
}

const Header: FC<HeaderProps> = ({ title, showBack = false }) => {
  const navigate = useNavigate()

  return (
    <div className='navbar bg-base-100 shadow-sm'>
      <span className='btn btn-ghost text-xl'>{title}</span>
      <div className='flex-1'>
        {showBack && (
          <button className='btn btn-ghost btn-sm' onClick={() => navigate(-1)}>
            <ArrowLeft className='h-5 w-5' />
          </button>
        )}
      </div>
    </div>
  )
}

export default Header
