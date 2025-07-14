import { FC } from 'react'
import { AlertCircle, RotateCw } from 'lucide-react'
import { useData } from '../context/DataContext'

interface ErrorViewProps {
  message: string
  fullScreen?: boolean
  onRetry?: () => void
}

const ErrorView: FC<ErrorViewProps> = ({ 
  message, 
  fullScreen = true,
  onRetry 
}) => {
  const { reloadData } = useData()
  const containerClasses = `flex items-center justify-center z-50 ${fullScreen ? 'fixed inset-0' : 'py-12'}`
  
  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      reloadData()
    }
  }

  return (
    <div className={containerClasses}>
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body items-center text-center">
          <AlertCircle className="h-12 w-12 text-error mb-4" />
          <h2 className="card-title text-lg">{message}</h2>
          <div className="card-actions mt-4">
            <button 
              className="btn btn-primary"
              onClick={handleRetry}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorView
