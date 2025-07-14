import * as React from 'react'
import { cn } from '@/utils/cn'

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  scrollbarClassName?: string
  orientation?: 'vertical' | 'horizontal'
  hideScrollbar?: boolean
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ 
    className, 
    scrollbarClassName,
    orientation = 'vertical',
    hideScrollbar = false,
    children, 
    ...props 
  }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          'overflow-auto',
          hideScrollbar && 'scrollbar-hide',
          orientation === 'horizontal' && 'flex overflow-x-auto',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ScrollArea.displayName = 'ScrollArea'

interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  orientation?: 'vertical' | 'horizontal'
}

const ScrollBar = React.forwardRef<HTMLDivElement, ScrollBarProps>(
  ({ className, orientation = 'vertical', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-base-200 rounded-full',
          orientation === 'vertical' ? 'w-2.5 h-full' : 'h-2.5 w-full',
          className
        )}
        {...props}
      />
    )
  }
)
ScrollBar.displayName = 'ScrollBar'

export { ScrollArea, ScrollBar }
