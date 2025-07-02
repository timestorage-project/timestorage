import * as React from 'react'
import { cn } from '@/utils/cn'
import { Motion } from './motion'

export interface HeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  leftSection?: React.ReactNode
  rightSection?: React.ReactNode
  showMenu?: boolean
}

const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ className, title, leftSection, rightSection, ...props }, ref) => {
    return (
      <div
        className={cn(
          'sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm',
          className
        )}
        ref={ref}
        {...props}
      >
        <div className='flex items-center'>{leftSection}</div>

        <Motion
          variant="fadeIn"
          className='flex-1 text-center font-semibold'
        >
          {title}
        </Motion>

        <div className='flex items-center'>{rightSection}</div>
      </div>
    )
  }
)
Header.displayName = 'Header'

export { Header }
