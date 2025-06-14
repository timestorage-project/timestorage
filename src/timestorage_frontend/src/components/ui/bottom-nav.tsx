import * as React from 'react'
import { cn } from '@/utils/cn'
import { motion, HTMLMotionProps } from 'framer-motion'

export interface BottomNavProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
}

const BottomNav = React.forwardRef<HTMLDivElement, BottomNavProps>(({ className, children, ...props }, ref) => {
  return (
    <div
      className={cn(
        'gap-2 fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center border-t  p-2 shadow-md',
        className
      )}
      ref={ref}
      style={{ backgroundColor: 'white' }} // Diagnostic: force white background
    >
      <motion.div
        className='w-full flex items-center justify-center gap-4'
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        {...props}
      >
        {children}
      </motion.div>
    </div>
  )
})

BottomNav.displayName = 'BottomNav'

export { BottomNav }
