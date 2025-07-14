import { FC } from 'react'

interface LoadingViewProps {
  message?: string
  fullScreen?: boolean
}

const LoadingView: FC<LoadingViewProps> = ({ 
  message = 'Loading...',
  fullScreen = true 
}) => {
  const containerClasses = `flex flex-col items-center justify-center p-4 ${fullScreen ? 'min-h-screen' : 'py-12'}`
  
  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <h2 className="text-xl font-medium text-center">
          {message}
        </h2>
      </div>
    </div>
  )
}

export default LoadingView
