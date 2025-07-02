import * as React from 'react'
import { cn } from '@/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * If true, the card will have a border
   * @default true
   */
  bordered?: boolean
  /**
   * If true, the card will have a shadow
   * @default true
   */
  shadow?: boolean
  /**
   * The variant of the card
   * @default 'default'
   */
  variant?: 'default' | 'bordered' | 'ghost' | 'compact'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, bordered = true, shadow = true, variant = 'default', ...props }, ref) => {
    const baseClasses = 'card bg-base-100'
    const variantClasses = {
      default: '',
      bordered: 'border border-base-300',
      ghost: 'bg-opacity-50',
      compact: 'card-compact'
    }

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      {
        'border border-base-300': bordered && variant !== 'bordered',
        'shadow-md': shadow
      },
      className
    )

    return <div ref={ref} className={classes} {...props} />
  }
)
Card.displayName = 'Card'

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * If true, adds bottom margin to the header
   * @default true
   */
  withDivider?: boolean
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, withDivider = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'card-title p-6',
        {
          'border-b border-base-200 pb-4 mb-4': withDivider
        },
        className
      )}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { as?: React.ElementType }
>(({ className, as: Component = 'h3', ...props }, ref) => (
  <Component ref={ref} className={cn('text-xl font-bold', className)} {...props} />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-base-content/70', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('card-body p-6', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('card-actions justify-end p-6 pt-0', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
export type { CardProps, CardHeaderProps }
