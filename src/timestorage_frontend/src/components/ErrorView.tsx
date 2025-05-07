import { FC } from 'react'
import { AlertCircle } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Button } from './ui/button'
import { Typography } from './ui/typography'
import { Motion } from './ui/motion'

interface ErrorViewProps {
  message: string
}

const ErrorView: FC<ErrorViewProps> = ({ message }) => {
  const { reloadData } = useData()

  return (
    <div className='fixed inset-0 flex items-center justify-center /90 z-50'>
      <div className='flex items-center justify-center'>
        <Motion variant='scale' duration={0.4}>
          <div className='flex flex-col items-center gap-4 p-6 rounded-lg bg-card shadow-lg border'>
            <AlertCircle className='h-12 w-12 text-destructive' />
            <Typography variant='h5' className='text-center'>
              {message}
            </Typography>
            <Button variant='default' onClick={reloadData} className='mt-2'>
              Try Again
            </Button>
          </div>
        </Motion>
      </div>
    </div>
  )
}

export default ErrorView
