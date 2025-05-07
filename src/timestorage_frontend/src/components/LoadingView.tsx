import { FC } from 'react'
import { Spinner } from './ui/spinner'
import { Typography } from './ui/typography'
import { Motion } from './ui/motion'

interface LoadingViewProps {
  message?: string
}

const LoadingView: FC<LoadingViewProps> = ({ message = 'Loading...' }) => {
  return (
    <div className='min-h-screen  flex flex-col items-center justify-center p-4'>
      <Motion variant='scale' duration={0.5}>
        <div className='flex flex-col items-center'>
          <Spinner size='lg' className='mb-4' />
          <Typography variant='h4' className='mt-2'>
            {message}
          </Typography>
        </div>
      </Motion>
    </div>
  )
}

export default LoadingView
