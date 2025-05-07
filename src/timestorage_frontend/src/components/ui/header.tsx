import * as React from 'react'
import { cn } from '@/utils/cn'
import { AnimatePresence, motion } from 'framer-motion'

export interface HeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  leftSection?: React.ReactNode
  rightSection?: React.ReactNode
  showMenu?: boolean
}

const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ className, title, leftSection, rightSection, ...props }, ref) => {
    // Using AnimatePresence for safer animation handling with TypeScript
    return (
      <div
        className={cn(
          'sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm',
          className
        )}
        ref={ref}
        {...props}
      >
        <div className='flex items-center'>{leftSection}</div>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='flex-1 text-center font-semibold'
          >
            {title}
          </motion.div>
        </AnimatePresence>

        <div className='flex items-center'>{rightSection}</div>
      </div>
    )
  }
)
Header.displayName = 'Header'

export { Header }
