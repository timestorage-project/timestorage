import { FC } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'

interface HeaderProps {
  title: string
  showBack?: boolean
}

const Header: FC<HeaderProps> = ({ title, showBack = false }) => {
  const navigate = useNavigate()
  const { language, setLanguage } = useTranslation()

  return (
    <div className='navbar bg-base-100 shadow-sm'>
      <div className='flex-1'>
        {showBack && (
          <button className='btn btn-ghost btn-sm' onClick={() => navigate(-1)}>
            <ArrowLeft className='h-5 w-5' />
          </button>
        )}
        <span className='btn btn-ghost text-xl'>{title}</span>
      </div>
      <div className='flex-none'>
        <select
          className='select select-bordered select-sm'
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'en' | 'it')}
        >
          <option value='en'>English</option>
          <option value='it'>Italiano</option>
        </select>
      </div>
    </div>
  )
}

export default Header
