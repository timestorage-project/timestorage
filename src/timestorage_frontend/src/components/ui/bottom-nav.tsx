import * as React from 'react'
import { cn } from '@/utils/cn'
import { Motion } from './motion'

export interface BottomNavProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const BottomNav = React.forwardRef<HTMLDivElement, BottomNavProps>(({ className, children, ...props }, ref) => {
  return (
    <div
      className={cn(
        'gap-2 fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center border-t p-2 shadow-md bg-white',
        className
      )}
      ref={ref}
    >
      <Motion
        variant="slideUp"
        className='w-full flex items-center justify-center gap-4'
        {...props}
      >
        {children}
      </Motion>
    </div>
  )
})

BottomNav.displayName = 'BottomNav'

export { BottomNav }
