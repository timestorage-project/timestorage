import * as React from 'react'
import { cn } from '@/utils/cn'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The maximum width of the container
   * @default 'lg'
   */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full' | 'screen' | 'screen-sm' | 'screen-md' | 'screen-lg' | 'screen-xl' | 'screen-2xl' | null
  /**
   * If true, the container will have padding on the sides
   * @default true
   */
  padded?: boolean
  /**
   * If true, the container will be centered horizontally
   * @default true
   */
  centered?: boolean
}

/**
 * A responsive container component that centers your content horizontally.
 * Built with DaisyUI and Tailwind CSS classes.
 */
const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({
    className,
    maxWidth = 'lg',
    padded = true,
    centered = true,
    children,
    ...props
  }, ref) => {
    const maxWidthClasses = {
      // DaisyUI container sizes
      xs: 'max-w-xs',
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '3xl': 'max-w-3xl',
      '4xl': 'max-w-4xl',
      '5xl': 'max-w-5xl',
      '6xl': 'max-w-6xl',
      '7xl': 'max-w-7xl',
      full: 'max-w-full',
      screen: 'max-w-screen',
      'screen-sm': 'max-w-screen-sm',
      'screen-md': 'max-w-screen-md',
      'screen-lg': 'max-w-screen-lg',
      'screen-xl': 'max-w-screen-xl',
      'screen-2xl': 'max-w-screen-2xl',
      null: ''
    }

    const baseClasses = 'w-full'

    const maxWidthClass = maxWidth !== null ? maxWidthClasses[maxWidth] || '' : ''

    const classes = cn(
      baseClasses,
      {
        'mx-auto': centered,
        'px-4 sm:px-6 lg:px-8': padded
      },
      maxWidthClass,
      className
    )

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

Container.displayName = 'Container'

export { Container }
