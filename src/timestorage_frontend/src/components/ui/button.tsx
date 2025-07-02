import * as React from 'react'
import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'link' | 'outline' | 'active' | 'disabled' | 'glass'
type ButtonSize = 'lg' | 'md' | 'sm' | 'xs'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The variant of the button
   * @default 'primary'
   */
  variant?: ButtonVariant
  /**
   * The size of the button
   * @default 'md'
   */
  size?: ButtonSize
  /**
   * If true, the button will be rendered as a block element
   * @default false
   */
  block?: boolean
  /**
   * If true, the button will be rendered in a loading state
   * @default false
   */
  loading?: boolean
  /**
   * If true, the button will be rendered as a circle
   * @default false
   */
  circle?: boolean
  /**
   * If true, the button will be rendered as a square
   * @default false
   */
  square?: boolean
  /**
   * If true, the button will be rendered with no animation
   * @default false
   */
  noAnimation?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    block = false,
    loading = false,
    circle = false,
    square = false,
    noAnimation = false,
    disabled,
    children,
    ...props
  }, ref) => {
    const baseClasses = 'btn'
    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      accent: 'btn-accent',
      ghost: 'btn-ghost',
      link: 'btn-link',
      outline: 'btn-outline',
      active: 'btn-active',
      disabled: 'btn-disabled',
      glass: 'glass'
    }
    
    const sizeClasses = {
      lg: 'btn-lg',
      md: 'btn-md',
      sm: 'btn-sm',
      xs: 'btn-xs'
    }

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      {
        'btn-block': block,
        'btn-circle': circle,
        'btn-square': square,
        'no-animation': noAnimation,
        'btn-disabled': disabled || loading,
        'loading': loading
      },
      className
    )

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? <span className="loading loading-spinner"></span> : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
