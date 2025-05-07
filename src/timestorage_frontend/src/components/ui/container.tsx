import * as React from 'react'
import { cn } from '@/utils/cn'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | null
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, maxWidth = 'lg', children, ...props }, ref) => {
    const maxWidthClasses = {
      xs: 'max-w-xs',
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      full: 'max-w-full',
      null: ''
    }

    return (
      <div
        ref={ref}
        className={cn('mx-auto w-full px-4 md:px-6', maxWidth ? maxWidthClasses[maxWidth] : '', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Container.displayName = 'Container'

export { Container }
