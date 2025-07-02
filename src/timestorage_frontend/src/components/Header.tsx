import { FC } from 'react'
import { ArrowLeft, Menu, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title: string
  showBack?: boolean
  showMenu?: boolean
  showSync?: boolean
  onMenuClick?: () => void
  onSyncClick?: () => void
}

const Header: FC<HeaderProps> = ({ 
  title, 
  showBack = false, 
  showMenu = false, 
  showSync = true,
  onMenuClick,
  onSyncClick
}) => {
  const navigate = useNavigate()

  return (
    <div className="navbar bg-base-100 shadow-sm">
      <a className="btn btn-ghost text-xl">{title}</a>
      <div className="flex-1">
        {showBack && (
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="flex-none">
        {showSync && (
          <button 
            className="btn btn-ghost btn-sm"
            onClick={onSyncClick}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        )}
        {showMenu && (
          <button 
            className="btn btn-ghost btn-sm"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}

export default Header
