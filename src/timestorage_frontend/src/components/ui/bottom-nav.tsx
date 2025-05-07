import * as React from 'react'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'

export interface BottomNavProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const BottomNav = React.forwardRef<HTMLDivElement, BottomNavProps>(({ className, children, ...props }, ref) => {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t  p-2 shadow-md',
        className
      )}
      ref={ref}
      {...props}
    >
      <motion.div
        className='w-full'
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </div>
  )
})

BottomNav.displayName = 'BottomNav'

export { BottomNav }
