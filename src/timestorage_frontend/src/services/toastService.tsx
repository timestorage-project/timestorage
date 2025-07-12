import React from 'react'
import { toast, ToastOptions, Id } from 'react-toastify'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

interface ToastContentProps {
  message: string
  icon: React.ReactNode
  closeToast?: () => void
}

const ToastContent: React.FC<ToastContentProps> = ({ message, icon, closeToast }) => (
  <div className='toast-content'>
    <div className='toast-message'>{message}</div>
  </div>
)

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  closeButton: ({ closeToast }) => (
    <button onClick={closeToast} className='btn btn-sm btn-ghost btn-square absolute top-2 right-2' aria-label='Close'>
      <X className='w-4 h-4' />
    </button>
  )
}

export const toastService = {
  success: (message: string, options?: ToastOptions): Id => {
    return toast.success(<ToastContent message={message} icon={<CheckCircle className='w-5 h-5' />} />, {
      ...defaultOptions,
      ...options
    })
  },

  error: (message: string, options?: ToastOptions): Id => {
    return toast.error(<ToastContent message={message} icon={<XCircle className='w-5 h-5' />} />, {
      ...defaultOptions,
      autoClose: 5000,
      ...options
    })
  },

  warning: (message: string, options?: ToastOptions): Id => {
    return toast.warning(<ToastContent message={message} icon={<AlertCircle className='w-5 h-5' />} />, {
      ...defaultOptions,
      ...options
    })
  },

  info: (message: string, options?: ToastOptions): Id => {
    return toast.info(<ToastContent message={message} icon={<Info className='w-5 h-5' />} />, {
      ...defaultOptions,
      ...options
    })
  },

  dismiss: (toastId?: Id): void => {
    toast.dismiss(toastId)
  },

  dismissAll: (): void => {
    toast.dismiss()
  }
}

export default toastService
